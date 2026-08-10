// Package market defines the market data provider interface and shared types.
package market

import (
	"context"
	"time"
)

// Quote holds current pricing data for a single asset.
type Quote struct {
	Ticker      string
	CompanyName string
	Price       float64
	Currency    string
	Change24h   float64 // absolute change in the last 24 hours
	PctChange   float64 // percentage change
	Exchange    string
	LogoURL     string
	UpdatedAt   time.Time
}

// TickerResult is a single result from a ticker search query.
type TickerResult struct {
	Ticker      string `json:"ticker"`
	CompanyName string `json:"company_name"`
	Exchange    string `json:"exchange"`
	AssetType   string `json:"asset_type"` // EQUITY, ETF, CRYPTO, etc.
	LogoURL     string `json:"logo_url,omitempty"`
}

// OHLCV represents a single candlestick data point.
type OHLCV struct {
	Time   time.Time
	Open   float64
	High   float64
	Low    float64
	Close  float64
	Volume float64
}

// Period defines the time range for historical data.
type Period string

const (
	Period1W  Period = "1w"
	Period1M  Period = "1m"
	Period3M  Period = "3m"
	Period6M  Period = "6m"
	Period1Y  Period = "1y"
	Period5Y  Period = "5y"
	PeriodAll Period = "all"
)

//go:generate mockgen -source market.go -destination ./mock/mock_market.go -package mock MarketDataProvider

// MarketDataProvider is the interface for fetching live and historical market prices.
type MarketDataProvider interface {
	// GetStockQuote returns current price and metadata for a stock ticker.
	GetStockQuote(ctx context.Context, ticker string) (Quote, error)
	// SearchTicker searches for tickers matching the query string (name or symbol).
	SearchTicker(ctx context.Context, query string) ([]TickerResult, error)
	// GetHistoricalPrice returns the closing price for a ticker on the given date.
	// If the date falls on a weekend or holiday, the nearest prior trading day is used.
	// The second return value is the actual date whose price was used.
	GetHistoricalPrice(ctx context.Context, ticker string, date time.Time) (price float64, dateUsed time.Time, err error)
	// GetCryptoPrice returns the current price for a crypto asset by CoinGecko ID.
	GetCryptoPrice(ctx context.Context, coinID, currency string) (Quote, error)
	// GetExchangeRate returns the conversion rate from one currency to another.
	GetExchangeRate(ctx context.Context, from, to string) (float64, error)
	// GetStockHistory returns OHLCV data for a stock over the given period.
	GetStockHistory(ctx context.Context, ticker string, period Period) ([]OHLCV, error)
	// GetCryptoHistory returns OHLCV data for a crypto asset over the given period.
	GetCryptoHistory(ctx context.Context, coinID string, period Period) ([]OHLCV, error)
}
