// Package yahoo implements market.MarketDataProvider using Yahoo Finance public APIs.
package yahoo

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/wearegravitylabs/silo/api/thirdparty/market"
)

const (
	defaultBaseURL = "https://query1.finance.yahoo.com"
	userAgent      = "Mozilla/5.0 (compatible; Silo/1.0)"
	maxRetryDays   = 7 // how many prior days to try when a date has no data
)

// Client fetches stock data from Yahoo Finance public endpoints.
// No API key is required; the free tier is rate-limited.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// New returns a Yahoo Finance market data client.
func New(baseURL string) market.MarketDataProvider {
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	return &Client{
		baseURL:    strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// ─── Internal HTTP helper ─────────────────────────────────────────────────────

func (c *Client) get(ctx context.Context, path string, params url.Values) ([]byte, error) {
	rawURL := c.baseURL + path
	if len(params) > 0 {
		rawURL += "?" + params.Encode()
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("yahoo: HTTP %d for %s", resp.StatusCode, path)
	}
	return io.ReadAll(resp.Body)
}

// ─── SearchTicker ─────────────────────────────────────────────────────────────

// SearchTicker queries Yahoo Finance for tickers matching the given string.
func (c *Client) SearchTicker(ctx context.Context, query string) ([]market.TickerResult, error) {
	params := url.Values{
		"q":           {query},
		"quotesCount": {"10"},
		"newsCount":   {"0"},
		"listsCount":  {"0"},
	}
	body, err := c.get(ctx, "/v1/finance/search", params)
	if err != nil {
		return nil, fmt.Errorf("yahoo: SearchTicker: %w", err)
	}

	var resp struct {
		Quotes []struct {
			Symbol    string `json:"symbol"`
			ShortName string `json:"shortname"`
			LongName  string `json:"longname"`
			Exchange  string `json:"exchange"`
			QuoteType string `json:"quoteType"`
		} `json:"quotes"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("yahoo: SearchTicker decode: %w", err)
	}

	results := make([]market.TickerResult, 0, len(resp.Quotes))
	for _, q := range resp.Quotes {
		if q.QuoteType != "EQUITY" && q.QuoteType != "ETF" && q.QuoteType != "MUTUALFUND" {
			continue
		}
		name := q.LongName
		if name == "" {
			name = q.ShortName
		}
		results = append(results, market.TickerResult{
			Ticker:      q.Symbol,
			CompanyName: name,
			Exchange:    q.Exchange,
			AssetType:   q.QuoteType,
		})
	}
	return results, nil
}

// GetStockQuote returns the current price and metadata for a stock ticker.
func (c *Client) GetStockQuote(ctx context.Context, ticker string) (market.Quote, error) {
	params := url.Values{
		"symbols": {ticker},
		"fields":  {"shortName,longName,regularMarketPrice,currency,fullExchangeName,regularMarketChange,regularMarketChangePercent,logoUrl"},
	}
	body, err := c.get(ctx, "/v8/finance/quote", params)
	if err != nil {
		return market.Quote{}, fmt.Errorf("yahoo: GetStockQuote: %w", err)
	}

	var resp struct {
		QuoteResponse struct {
			Result []struct {
				Symbol                     string  `json:"symbol"`
				ShortName                  string  `json:"shortName"`
				LongName                   string  `json:"longName"`
				RegularMarketPrice         float64 `json:"regularMarketPrice"`
				Currency                   string  `json:"currency"`
				FullExchangeName           string  `json:"fullExchangeName"`
				RegularMarketChange        float64 `json:"regularMarketChange"`
				RegularMarketChangePercent float64 `json:"regularMarketChangePercent"`
			} `json:"result"`
			Error *struct{ Code string } `json:"error"`
		} `json:"quoteResponse"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return market.Quote{}, fmt.Errorf("yahoo: GetStockQuote decode: %w", err)
	}
	if resp.QuoteResponse.Error != nil {
		return market.Quote{}, fmt.Errorf("yahoo: %s", resp.QuoteResponse.Error.Code)
	}
	if len(resp.QuoteResponse.Result) == 0 {
		return market.Quote{}, fmt.Errorf("yahoo: ticker %q not found", ticker)
	}

	r := resp.QuoteResponse.Result[0]
	name := r.LongName
	if name == "" {
		name = r.ShortName
	}

	// Yahoo Finance doesn't always return a logoUrl field; build a fallback.
	logoURL := logoFallback(r.Symbol)

	return market.Quote{
		Ticker:      r.Symbol,
		CompanyName: name,
		Price:       r.RegularMarketPrice,
		Currency:    r.Currency,
		Change24h:   r.RegularMarketChange,
		PctChange:   r.RegularMarketChangePercent,
		Exchange:    r.FullExchangeName,
		LogoURL:     logoURL,
		UpdatedAt:   time.Now().UTC(),
	}, nil
}

// ─── GetHistoricalPrice ───────────────────────────────────────────────────────

// GetHistoricalPrice returns the close price for ticker on the given date.
// If the date is a weekend or holiday (no trading data), it retries with the
// previous day up to maxRetryDays times. The actual date used is returned.
func (c *Client) GetHistoricalPrice(ctx context.Context, ticker string, date time.Time) (float64, time.Time, error) {
	date = date.UTC().Truncate(24 * time.Hour)

	for attempt := 0; attempt < maxRetryDays; attempt++ {
		tryDate := date.AddDate(0, 0, -attempt)
		period1 := tryDate.Unix()
		period2 := tryDate.Add(36 * time.Hour).Unix() // +36h to catch end-of-day data

		params := url.Values{
			"period1":  {fmt.Sprintf("%d", period1)},
			"period2":  {fmt.Sprintf("%d", period2)},
			"interval": {"1d"},
		}
		body, err := c.get(ctx, fmt.Sprintf("/v8/finance/chart/%s", url.PathEscape(ticker)), params)
		if err != nil {
			continue
		}

		price, ok := extractClosePrice(body)
		if !ok {
			continue // no data for this date — try previous day
		}
		return price, tryDate, nil
	}

	return 0, time.Time{}, fmt.Errorf("yahoo: no historical price found for %s near %s", ticker, date.Format("2006-01-02"))
}

// extractClosePrice pulls the first available close price from a Yahoo chart response.
func extractClosePrice(body []byte) (float64, bool) {
	var resp struct {
		Chart struct {
			Result []struct {
				Indicators struct {
					Quote []struct {
						Close []any `json:"close"`
					} `json:"quote"`
				} `json:"indicators"`
			} `json:"result"`
		} `json:"chart"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return 0, false
	}
	if len(resp.Chart.Result) == 0 {
		return 0, false
	}
	quotes := resp.Chart.Result[0].Indicators.Quote
	if len(quotes) == 0 || len(quotes[0].Close) == 0 {
		return 0, false
	}
	// Close values may be null (non-trading day) — find the first non-null one.
	for _, v := range quotes[0].Close {
		if v == nil {
			continue
		}
		if f, ok := v.(float64); ok && f > 0 {
			return f, true
		}
	}
	return 0, false
}

// logoFallback returns a best-effort logo URL using Clearbit's free logo API.
// This is a fallback — Yahoo Finance does not reliably expose logo URLs.
func logoFallback(ticker string) string {
	// Clearbit maps tickers to company domains — works for most major US stocks.
	// Returns empty string for unknown tickers; FE should handle gracefully.
	return fmt.Sprintf("https://logo.clearbit.com/%s.com", strings.ToLower(ticker))
}

// ─── Stubs for interface compliance ───────────────────────────────────────────

// GetCryptoPrice is not implemented in the Yahoo provider — use CoinGecko.
func (c *Client) GetCryptoPrice(ctx context.Context, coinID, currency string) (market.Quote, error) {
	return market.Quote{}, fmt.Errorf("yahoo: use CoinGecko for crypto prices")
}

// GetExchangeRate fetches FX rate using Yahoo Finance FX tickers (e.g. EURUSD=X).
func (c *Client) GetExchangeRate(ctx context.Context, from, to string) (float64, error) {
	if strings.EqualFold(from, to) {
		return 1.0, nil
	}
	fxTicker := fmt.Sprintf("%s%s=X", strings.ToUpper(from), strings.ToUpper(to))
	q, err := c.GetStockQuote(ctx, fxTicker)
	if err != nil {
		return 0, fmt.Errorf("yahoo: GetExchangeRate %s→%s: %w", from, to, err)
	}
	return q.Price, nil
}

// GetStockHistory returns OHLCV data for a stock over the given period.
func (c *Client) GetStockHistory(ctx context.Context, ticker string, period market.Period) ([]market.OHLCV, error) {
	rangeStr := periodToRange(period)
	params := url.Values{
		"range":    {rangeStr},
		"interval": {"1d"},
	}
	body, err := c.get(ctx, fmt.Sprintf("/v8/finance/chart/%s", url.PathEscape(ticker)), params)
	if err != nil {
		return nil, fmt.Errorf("yahoo: GetStockHistory: %w", err)
	}
	return parseOHLCV(body)
}

// GetCryptoHistory is not implemented — use CoinGecko.
func (c *Client) GetCryptoHistory(ctx context.Context, coinID string, period market.Period) ([]market.OHLCV, error) {
	return nil, fmt.Errorf("yahoo: use CoinGecko for crypto history")
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func periodToRange(p market.Period) string {
	switch p {
	case market.Period1W:
		return "5d"
	case market.Period1M:
		return "1mo"
	case market.Period3M:
		return "3mo"
	case market.Period6M:
		return "6mo"
	case market.Period1Y:
		return "1y"
	case market.Period5Y:
		return "5y"
	default:
		return "max"
	}
}

func parseOHLCV(body []byte) ([]market.OHLCV, error) {
	var resp struct {
		Chart struct {
			Result []struct {
				Timestamp  []int64 `json:"timestamp"`
				Indicators struct {
					Quote []struct {
						Open   []any `json:"open"`
						High   []any `json:"high"`
						Low    []any `json:"low"`
						Close  []any `json:"close"`
						Volume []any `json:"volume"`
					} `json:"quote"`
				} `json:"indicators"`
			} `json:"result"`
		} `json:"chart"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}
	if len(resp.Chart.Result) == 0 {
		return nil, fmt.Errorf("yahoo: no chart data")
	}
	r := resp.Chart.Result[0]
	if len(r.Timestamp) == 0 || len(r.Indicators.Quote) == 0 {
		return nil, fmt.Errorf("yahoo: empty chart data")
	}
	q := r.Indicators.Quote[0]
	candles := make([]market.OHLCV, 0, len(r.Timestamp))
	for i, ts := range r.Timestamp {
		candle := market.OHLCV{Time: time.Unix(ts, 0).UTC()}
		if i < len(q.Open) {
			if v, ok := q.Open[i].(float64); ok {
				candle.Open = v
			}
		}
		if i < len(q.High) {
			if v, ok := q.High[i].(float64); ok {
				candle.High = v
			}
		}
		if i < len(q.Low) {
			if v, ok := q.Low[i].(float64); ok {
				candle.Low = v
			}
		}
		if i < len(q.Close) {
			if v, ok := q.Close[i].(float64); ok {
				candle.Close = v
			}
		}
		if i < len(q.Volume) {
			if v, ok := q.Volume[i].(float64); ok {
				candle.Volume = v
			}
		}
		candles = append(candles, candle)
	}
	return candles, nil
}
