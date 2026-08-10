// Package coingecko implements market.MarketDataProvider for cryptocurrency data.
package coingecko

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
	defaultBaseURL = "https://api.coingecko.com/api/v3"
	userAgent      = "Mozilla/5.0 (compatible; Silo/1.0)"
)

// Client fetches crypto data from the CoinGecko public API.
type Client struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// New returns a CoinGecko market data client.
func New(apiKey, baseURL string) market.MarketDataProvider {
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	return &Client{
		apiKey:     apiKey,
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
	if c.apiKey != "" {
		req.Header.Set("x-cg-demo-api-key", c.apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("coingecko: HTTP %d for %s", resp.StatusCode, path)
	}
	return io.ReadAll(resp.Body)
}

// ─── SearchTicker ─────────────────────────────────────────────────────────────

// SearchTicker searches CoinGecko for coins matching the query (name or symbol).
func (c *Client) SearchTicker(ctx context.Context, query string) ([]market.TickerResult, error) {
	params := url.Values{"query": {query}}
	body, err := c.get(ctx, "/search", params)
	if err != nil {
		return nil, fmt.Errorf("coingecko: SearchTicker: %w", err)
	}

	var resp struct {
		Coins []struct {
			ID     string `json:"id"`     // e.g. "bitcoin"
			Symbol string `json:"symbol"` // e.g. "btc"
			Name   string `json:"name"`   // e.g. "Bitcoin"
			Thumb  string `json:"thumb"`  // small logo URL
		} `json:"coins"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("coingecko: SearchTicker decode: %w", err)
	}

	results := make([]market.TickerResult, 0, len(resp.Coins))
	for _, coin := range resp.Coins {
		results = append(results, market.TickerResult{
			Ticker:      coin.ID, // coin ID is used as the ticker for CoinGecko
			CompanyName: coin.Name,
			Exchange:    strings.ToUpper(coin.Symbol),
			AssetType:   "CRYPTO",
			LogoURL:     coin.Thumb,
		})
	}
	return results, nil
}

// ─── GetCryptoPrice ───────────────────────────────────────────────────────────

// GetCryptoPrice returns the current price for a coin by its CoinGecko ID.
func (c *Client) GetCryptoPrice(ctx context.Context, coinID, currency string) (market.Quote, error) {
	if currency == "" {
		currency = "usd"
	}
	currency = strings.ToLower(currency)

	params := url.Values{
		"ids":                   {coinID},
		"vs_currencies":         {currency},
		"include_24hr_change":   {"true"},
		"include_market_cap":    {"false"},
		"include_24hr_vol":      {"false"},
	}
	body, err := c.get(ctx, "/simple/price", params)
	if err != nil {
		return market.Quote{}, fmt.Errorf("coingecko: GetCryptoPrice: %w", err)
	}

	var resp map[string]map[string]float64
	if err := json.Unmarshal(body, &resp); err != nil {
		return market.Quote{}, fmt.Errorf("coingecko: GetCryptoPrice decode: %w", err)
	}

	data, ok := resp[coinID]
	if !ok {
		return market.Quote{}, fmt.Errorf("coingecko: coin %q not found", coinID)
	}

	price := data[currency]
	change := data[currency+"_24h_change"]

	return market.Quote{
		Ticker:    coinID,
		Price:     price,
		Currency:  strings.ToUpper(currency),
		PctChange: change,
		UpdatedAt: time.Now().UTC(),
	}, nil
}

// GetStockQuote delegates to GetCryptoPrice treating the ticker as a coin ID.
func (c *Client) GetStockQuote(ctx context.Context, ticker string) (market.Quote, error) {
	return c.GetCryptoPrice(ctx, ticker, "usd")
}

// ─── GetHistoricalPrice ───────────────────────────────────────────────────────

// GetHistoricalPrice returns the closing price for a coin on the given date.
// CoinGecko history endpoint returns the price at a specific date (DD-MM-YYYY).
func (c *Client) GetHistoricalPrice(ctx context.Context, coinID string, date time.Time) (float64, time.Time, error) {
	formatted := date.UTC().Format("02-01-2006") // CoinGecko expects DD-MM-YYYY
	params := url.Values{
		"date":          {formatted},
		"localization":  {"false"},
	}
	body, err := c.get(ctx, fmt.Sprintf("/coins/%s/history", url.PathEscape(coinID)), params)
	if err != nil {
		return 0, time.Time{}, fmt.Errorf("coingecko: GetHistoricalPrice: %w", err)
	}

	var resp struct {
		MarketData struct {
			CurrentPrice map[string]float64 `json:"current_price"`
		} `json:"market_data"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return 0, time.Time{}, fmt.Errorf("coingecko: GetHistoricalPrice decode: %w", err)
	}

	price, ok := resp.MarketData.CurrentPrice["usd"]
	if !ok || price == 0 {
		return 0, time.Time{}, fmt.Errorf("coingecko: no price data for %s on %s", coinID, formatted)
	}

	return price, date.UTC().Truncate(24 * time.Hour), nil
}

// ─── Other interface methods ──────────────────────────────────────────────────

// GetExchangeRate is not implemented in the CoinGecko provider — use Yahoo Finance for fiat FX.
func (c *Client) GetExchangeRate(ctx context.Context, from, to string) (float64, error) {
	return 0, fmt.Errorf("coingecko: use Yahoo Finance for fiat FX rates")
}

// GetStockHistory is not implemented — use Yahoo Finance for stock history.
func (c *Client) GetStockHistory(ctx context.Context, ticker string, period market.Period) ([]market.OHLCV, error) {
	return nil, fmt.Errorf("coingecko: use Yahoo Finance for stock history")
}

// GetCryptoHistory returns OHLCV data for a crypto coin using the market_chart endpoint.
func (c *Client) GetCryptoHistory(ctx context.Context, coinID string, period market.Period) ([]market.OHLCV, error) {
	days := periodToDays(period)
	params := url.Values{
		"vs_currency": {"usd"},
		"days":        {days},
		"interval":    {"daily"},
	}
	body, err := c.get(ctx, fmt.Sprintf("/coins/%s/market_chart", url.PathEscape(coinID)), params)
	if err != nil {
		return nil, fmt.Errorf("coingecko: GetCryptoHistory: %w", err)
	}

	var resp struct {
		Prices [][]float64 `json:"prices"` // [[timestamp_ms, price], ...]
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("coingecko: GetCryptoHistory decode: %w", err)
	}

	candles := make([]market.OHLCV, 0, len(resp.Prices))
	for _, p := range resp.Prices {
		if len(p) < 2 {
			continue
		}
		t := time.UnixMilli(int64(p[0])).UTC()
		price := p[1]
		candles = append(candles, market.OHLCV{
			Time:  t,
			Open:  price,
			High:  price,
			Low:   price,
			Close: price,
		})
	}
	return candles, nil
}

func periodToDays(p market.Period) string {
	switch p {
	case market.Period1W:
		return "7"
	case market.Period1M:
		return "30"
	case market.Period3M:
		return "90"
	case market.Period6M:
		return "180"
	case market.Period1Y:
		return "365"
	case market.Period5Y:
		return "1825"
	default:
		return "max"
	}
}
