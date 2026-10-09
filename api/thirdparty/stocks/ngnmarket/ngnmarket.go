// Package ngnmarket implements stocks.Provider on top of the NGN Market API
// (NGX and US equities) using the ngnmarket-go SDK.
//
// It is built for a small monthly quota (the Free plan is 3,000 calls):
//   - The whole NGX market (~150 companies, prices included) is one cached call,
//     and every NG list, search, quote and cron lookup is served from it.
//   - US quotes and list pages are cached per key.
//   - If the API fails (rate limit, quota, outage) a cached value up to 24 hours
//     old is served instead of an error, so the UI keeps working.
package ngnmarket

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	sdk "github.com/wearegravitylabs/ngnmarket-go/api"
	sdkmodel "github.com/wearegravitylabs/ngnmarket-go/model"

	"github.com/wearegravitylabs/silo/api/thirdparty/stocks"
)

const (
	quoteTTL     = 5 * time.Minute // how long a cached quote or NGX market is fresh
	listTTL      = 2 * time.Minute // how long a cached US list page is fresh
	staleIfError = 24 * time.Hour  // how old a cached value may be when the API is failing
	defaultLimit = 50
	maxLimit     = 100
	maxUSEntries = 2000 // bound on cached US quotes/pages
)

type entry[V any] struct {
	v  V
	at time.Time
}

// Provider is a stocks.Provider backed by NGN Market.
type Provider struct {
	c   sdk.RemoteCalls
	now func() time.Time
	// history reports whether past-date price lookups are allowed. They need a
	// paid NGN Market plan (Hobby+); when off, PriceOn answers
	// stocks.ErrHistoryUnavailable without spending an API call.
	history bool

	fetchMu sync.Mutex // serialises NGX market refreshes (single flight)

	mu     sync.Mutex
	ngx    *entry[[]sdkmodel.Company]
	usQuot map[string]entry[stocks.Stock]
	usList map[string]entry[stocks.Page]
}

var _ stocks.Provider = (*Provider)(nil)

// New builds a Provider. baseURL may be empty for the production API.
// requestsPerMinute paces calls below your plan's per-minute cap (Free: 30);
// 0 disables client-side pacing. Set historyEnabled only when the key's plan
// includes price history (Hobby or above).
func New(apiKey, baseURL string, requestsPerMinute int, historyEnabled bool) (*Provider, error) {
	opts := []sdk.Option{sdk.WithUserAgent("silo")}
	if baseURL != "" {
		opts = append(opts, sdk.WithBaseURL(baseURL))
	}
	if requestsPerMinute > 0 {
		opts = append(opts, sdk.WithRateLimit(requestsPerMinute, 0))
	}
	c, err := sdk.New(apiKey, opts...)
	if err != nil {
		return nil, err
	}
	return NewWithClient(c, historyEnabled), nil
}

// NewWithClient builds a Provider around an existing SDK client (used by tests).
func NewWithClient(c sdk.RemoteCalls, historyEnabled bool) *Provider {
	return &Provider{
		c:       c,
		now:     time.Now,
		history: historyEnabled,
		usQuot:  map[string]entry[stocks.Stock]{},
		usList:  map[string]entry[stocks.Page]{},
	}
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

func fromCompany(co sdkmodel.Company) stocks.Stock {
	return stocks.Stock{
		Symbol: co.Symbol, Name: co.Name, LogoURL: co.LogoURL, Sector: co.Sector,
		Country: stocks.CountryNG, Currency: "NGN",
		Price: co.Price, PrevClose: co.PrevClose, ChangePct: co.PriceChangePercent,
		MarketCap: co.MarketCap, QuoteTime: co.LastUpdated,
	}
}

func fromTicker(t sdkmodel.Ticker) stocks.Stock {
	return stocks.Stock{
		Symbol: t.Symbol, Name: t.Name, LogoURL: t.LogoURL, Sector: t.Sector,
		Country: stocks.CountryUS, Currency: "USD",
		Price: t.LastPrice, PrevClose: t.PrevClose, ChangePct: t.ChangePct,
		MarketCap: t.MarketCap, QuoteTime: t.QuoteTime, IsDelayed: bool(t.IsDelayed),
	}
}

// mapErr converts an SDK error to a stocks sentinel, keeping the cause in the text.
func mapErr(err error) error {
	switch {
	case err == nil:
		return nil
	case errors.Is(err, sdkmodel.ErrNotFound):
		return stocks.ErrNotFound
	case errors.Is(err, sdkmodel.ErrRateLimited):
		return stocks.ErrRateLimited
	case errors.Is(err, sdkmodel.ErrQuotaExceeded):
		return stocks.ErrQuotaExceeded
	default:
		return fmt.Errorf("%w: %v", stocks.ErrUnavailable, err)
	}
}

// ─── NGX: the whole market, cached ────────────────────────────────────────────

func (p *Provider) ngxAge() (time.Duration, bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.ngx == nil {
		return 0, false
	}
	return p.now().Sub(p.ngx.at), true
}

func (p *Provider) ngxData() []sdkmodel.Company {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.ngx.v
}

// ngxCompanies returns every NGX company with its price, refreshing at most once
// per quoteTTL and falling back to stale data if the refresh fails.
func (p *Provider) ngxCompanies(ctx context.Context) ([]sdkmodel.Company, error) {
	if age, ok := p.ngxAge(); ok && age < quoteTTL {
		return p.ngxData(), nil
	}

	p.fetchMu.Lock()
	defer p.fetchMu.Unlock()
	if age, ok := p.ngxAge(); ok && age < quoteTTL { // refreshed while we waited
		return p.ngxData(), nil
	}

	all, _, err := p.c.ListAllNGXCompanies(ctx)
	if err != nil {
		if age, ok := p.ngxAge(); ok && age < staleIfError {
			return p.ngxData(), nil
		}
		return nil, mapErr(err)
	}
	p.mu.Lock()
	p.ngx = &entry[[]sdkmodel.Company]{v: all, at: p.now()}
	p.mu.Unlock()
	return all, nil
}

// ─── stocks.Provider ──────────────────────────────────────────────────────────

func clampPaging(page, limit int) (int, int) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = defaultLimit
	}
	if limit > maxLimit {
		limit = maxLimit
	}
	return page, limit
}

// List implements stocks.Provider.
func (p *Provider) List(ctx context.Context, lp stocks.ListParams) (stocks.Page, error) {
	page, limit := clampPaging(lp.Page, lp.Limit)
	search := strings.TrimSpace(lp.Search)

	switch lp.Country {
	case stocks.CountryNG:
		all, err := p.ngxCompanies(ctx)
		if err != nil {
			return stocks.Page{}, err
		}
		needle := strings.ToLower(search)
		matched := make([]stocks.Stock, 0, len(all))
		for _, co := range all {
			if needle == "" || strings.Contains(strings.ToLower(co.Symbol), needle) || strings.Contains(strings.ToLower(co.Name), needle) {
				matched = append(matched, fromCompany(co))
			}
		}
		start := (page - 1) * limit
		if start > len(matched) {
			start = len(matched)
		}
		end := start + limit
		if end > len(matched) {
			end = len(matched)
		}
		return stocks.Page{Items: matched[start:end], Page: page, Limit: limit, Total: len(matched), HasNext: end < len(matched)}, nil

	case stocks.CountryUS:
		key := fmt.Sprintf("%s|%d|%d", search, page, limit)
		if v, age, ok := p.cachedList(key); ok && age < listTTL {
			return v, nil
		}
		res, err := p.c.ListUSTickers(ctx, &sdkmodel.ListTickersParams{Search: search, Page: page, Limit: limit})
		if err != nil {
			if v, age, ok := p.cachedList(key); ok && age < staleIfError {
				return v, nil
			}
			return stocks.Page{}, mapErr(err)
		}
		items := make([]stocks.Stock, len(res.Tickers))
		for i, t := range res.Tickers {
			items[i] = fromTicker(t)
		}
		out := stocks.Page{Items: items, Page: page, Limit: limit, Total: res.Pagination.Total, HasNext: res.Pagination.HasNext}
		p.mu.Lock()
		if len(p.usList) >= maxUSEntries {
			p.usList = map[string]entry[stocks.Page]{}
		}
		p.usList[key] = entry[stocks.Page]{v: out, at: p.now()}
		p.mu.Unlock()
		return out, nil
	}
	return stocks.Page{}, fmt.Errorf("%w: unsupported country %q", stocks.ErrUnavailable, lp.Country)
}

func (p *Provider) cachedList(key string) (stocks.Page, time.Duration, bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	e, ok := p.usList[key]
	if !ok {
		return stocks.Page{}, 0, false
	}
	return e.v, p.now().Sub(e.at), true
}

func (p *Provider) cachedQuote(symbol string) (stocks.Stock, time.Duration, bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	e, ok := p.usQuot[symbol]
	if !ok {
		return stocks.Stock{}, 0, false
	}
	return e.v, p.now().Sub(e.at), true
}

// Quote implements stocks.Provider.
func (p *Provider) Quote(ctx context.Context, c stocks.Country, symbol string) (stocks.Stock, error) {
	symbol = stocks.NormalizeSymbol(c, symbol)
	switch c {
	case stocks.CountryNG:
		all, err := p.ngxCompanies(ctx)
		if err != nil {
			return stocks.Stock{}, err
		}
		for _, co := range all {
			if strings.EqualFold(co.Symbol, symbol) {
				return fromCompany(co), nil
			}
		}
		return stocks.Stock{}, stocks.ErrNotFound

	case stocks.CountryUS:
		if v, age, ok := p.cachedQuote(symbol); ok && age < quoteTTL {
			return v, nil
		}
		tk, err := p.c.FindUSTicker(ctx, symbol)
		if err != nil {
			if errors.Is(err, sdkmodel.ErrNotFound) {
				return stocks.Stock{}, stocks.ErrNotFound
			}
			if v, age, ok := p.cachedQuote(symbol); ok && age < staleIfError {
				return v, nil
			}
			return stocks.Stock{}, mapErr(err)
		}
		st := fromTicker(*tk)
		p.mu.Lock()
		if len(p.usQuot) >= maxUSEntries {
			p.usQuot = map[string]entry[stocks.Stock]{}
		}
		p.usQuot[symbol] = entry[stocks.Stock]{v: st, at: p.now()}
		p.mu.Unlock()
		return st, nil
	}
	return stocks.Stock{}, fmt.Errorf("%w: unsupported country %q", stocks.ErrUnavailable, c)
}

// Quotes implements stocks.Provider.
func (p *Provider) Quotes(ctx context.Context, c stocks.Country, symbols []string) (map[string]stocks.Stock, error) {
	out := make(map[string]stocks.Stock, len(symbols))
	for _, sym := range symbols {
		if _, done := out[sym]; done {
			continue
		}
		q, err := p.Quote(ctx, c, sym)
		switch {
		case err == nil:
			out[sym] = q
		case errors.Is(err, stocks.ErrNotFound):
			// Unknown or delisted symbol: leave it out, keep going.
		default:
			return out, err // rate limit / quota / outage: stop, return what we have
		}
	}
	return out, nil
}

// PriceOn implements stocks.Provider.
func (p *Provider) PriceOn(ctx context.Context, c stocks.Country, symbol string, day time.Time) (float64, time.Time, error) {
	symbol = stocks.NormalizeSymbol(c, symbol)
	today := p.now().UTC().Truncate(24 * time.Hour)

	// Bought today (or later): the current quote is the price. This also works on
	// the Free plan, which has no history endpoint.
	if !day.UTC().Before(today) {
		q, err := p.Quote(ctx, c, symbol)
		return q.Price, today, err
	}

	// Past dates need the paid history endpoints. Without them the caller has
	// to ask the user for the price they paid.
	if !p.history {
		return 0, time.Time{}, stocks.ErrHistoryUnavailable
	}

	var (
		pt  sdkmodel.PricePoint
		err error
	)
	switch c {
	case stocks.CountryNG:
		pt, err = p.c.GetNGXClosePriceOnOrBefore(ctx, symbol, day)
	case stocks.CountryUS:
		pt, err = p.c.GetUSClosePriceOnOrBefore(ctx, symbol, day)
	default:
		return 0, time.Time{}, fmt.Errorf("%w: unsupported country %q", stocks.ErrUnavailable, c)
	}
	switch {
	case err == nil:
		used, perr := time.Parse("2006-01-02", pt.Date)
		if perr != nil {
			return 0, time.Time{}, fmt.Errorf("%w: bad date %q from provider", stocks.ErrUnavailable, pt.Date)
		}
		return pt.Close, used, nil
	case errors.Is(err, sdkmodel.ErrPlanRequired), errors.Is(err, sdkmodel.ErrNoData):
		return 0, time.Time{}, stocks.ErrHistoryUnavailable
	default:
		return 0, time.Time{}, mapErr(err)
	}
}
