// Package stocks defines the country-aware stock market data interface Silo uses
// for listing, pricing and back-pricing stock holdings.
//
// It is separate from package market (which is crypto/FX oriented and has no
// notion of country) so a provider can serve more than one exchange. Providers
// return the sentinel errors below so callers never depend on a vendor SDK.
package stocks

import (
	"context"
	"errors"
	"strings"
	"time"
)

// Country identifies the market a stock is listed in. It is what the UI passes
// when browsing tickers and what is stored on each stock asset.
type Country string

// Supported markets.
const (
	CountryNG Country = "NG" // Nigerian Exchange (NGX), prices in NGN
	CountryUS Country = "US" // US exchanges, prices in USD
)

// ParseCountry validates a user-supplied country code (case-insensitive).
func ParseCountry(s string) (Country, bool) {
	switch Country(strings.ToUpper(strings.TrimSpace(s))) {
	case CountryNG:
		return CountryNG, true
	case CountryUS:
		return CountryUS, true
	}
	return "", false
}

// CountryOrDefault parses s, falling back to the US market. Assets created
// before country support was added have an empty country and were US-priced.
func CountryOrDefault(s string) Country {
	if c, ok := ParseCountry(s); ok {
		return c
	}
	return CountryUS
}

// Currency is the currency prices in this market are quoted in.
func (c Country) Currency() string {
	if c == CountryNG {
		return "NGN"
	}
	return "USD"
}

// NormalizeSymbol applies the market's symbol-case rule: NGX symbols are
// case-insensitive (stored upper-case), US symbols are case-sensitive.
func NormalizeSymbol(c Country, symbol string) string {
	symbol = strings.TrimSpace(symbol)
	if c == CountryNG {
		return strings.ToUpper(symbol)
	}
	return symbol
}

// Stock is a listed security with its current quote.
type Stock struct {
	Symbol    string  `json:"symbol"`
	Name      string  `json:"name"`
	LogoURL   string  `json:"logo_url"`
	Sector    string  `json:"sector"`
	Country   Country `json:"country"`
	Currency  string  `json:"currency"`
	Price     float64 `json:"price"`
	PrevClose float64 `json:"prev_close"`
	ChangePct float64 `json:"change_pct"`
	MarketCap float64 `json:"market_cap"`
	// QuoteTime is when Price was captured. US quotes are delayed (see IsDelayed).
	QuoteTime *time.Time `json:"quote_time"`
	IsDelayed bool       `json:"is_delayed"`
}

// ListParams selects a page of stocks.
type ListParams struct {
	Country Country
	Search  string // matches symbol or company name
	Page    int    // 1-based
	Limit   int
}

// Page is one page of stocks.
type Page struct {
	Items   []Stock `json:"items"`
	Page    int     `json:"page"`
	Limit   int     `json:"limit"`
	Total   int     `json:"total"`
	HasNext bool    `json:"has_next"`
}

// Provider is a source of stock market data.
type Provider interface {
	// List returns a page of stocks for a market, optionally filtered by search.
	List(ctx context.Context, p ListParams) (Page, error)
	// Quote returns the current quote for one symbol. ErrNotFound if unknown.
	Quote(ctx context.Context, c Country, symbol string) (Stock, error)
	// Quotes returns current quotes for many symbols, keyed by the symbol exactly
	// as passed in. Unknown symbols are omitted. On a rate-limit or quota error
	// it returns the quotes gathered so far together with the error.
	Quotes(ctx context.Context, c Country, symbols []string) (map[string]Stock, error)
	// PriceOn returns the closing price on day, or on the nearest earlier trading
	// day (dateUsed). ErrHistoryUnavailable if the provider cannot supply it, for
	// example because the account plan has no price history.
	PriceOn(ctx context.Context, c Country, symbol string, day time.Time) (price float64, dateUsed time.Time, err error)
}

// Errors returned by Providers. Match with errors.Is.
var (
	// ErrNotFound: the symbol does not exist in that market.
	ErrNotFound = errors.New("stocks: symbol not found")
	// ErrRateLimited: the provider's per-minute limit was hit; retry shortly.
	ErrRateLimited = errors.New("stocks: provider rate limited")
	// ErrQuotaExceeded: the provider's monthly quota is spent; retrying will not help.
	ErrQuotaExceeded = errors.New("stocks: provider quota exceeded")
	// ErrHistoryUnavailable: no historical price could be provided.
	ErrHistoryUnavailable = errors.New("stocks: historical price unavailable")
	// ErrUnavailable: any other provider failure (network, 5xx, bad key).
	ErrUnavailable = errors.New("stocks: provider unavailable")
)
