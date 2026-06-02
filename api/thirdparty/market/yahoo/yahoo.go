// Package yahoo implements market.MarketDataProvider using Yahoo Finance.
package yahoo

import (
	"context"
	"fmt"

	"github.com/wearegravitylabs/silo/api/thirdparty/market"
)

// Client fetches stock data from Yahoo Finance.
type Client struct {
	baseURL string
}

// New returns a Yahoo Finance market data client.
func New(baseURL string) market.MarketDataProvider {
	if baseURL == "" {
		baseURL = "https://query1.finance.yahoo.com"
	}
	return &Client{baseURL: baseURL}
}

func (c *Client) GetStockQuote(ctx context.Context, ticker string) (market.Quote, error) {
	// TODO: implement Yahoo Finance v8 quote endpoint
	return market.Quote{}, fmt.Errorf("yahoo: GetStockQuote not yet implemented")
}

func (c *Client) GetCryptoPrice(ctx context.Context, coinID, currency string) (market.Quote, error) {
	return market.Quote{}, fmt.Errorf("yahoo: use CoinGecko for crypto prices")
}

func (c *Client) GetExchangeRate(ctx context.Context, from, to string) (float64, error) {
	// Yahoo Finance supports FX via {FROM}{TO}=X ticker
	// TODO: implement
	return 0, fmt.Errorf("yahoo: GetExchangeRate not yet implemented")
}

func (c *Client) GetStockHistory(ctx context.Context, ticker string, period market.Period) ([]market.OHLCV, error) {
	// TODO: implement Yahoo Finance v8 chart endpoint
	return nil, fmt.Errorf("yahoo: GetStockHistory not yet implemented")
}

func (c *Client) GetCryptoHistory(ctx context.Context, coinID string, period market.Period) ([]market.OHLCV, error) {
	return nil, fmt.Errorf("yahoo: use CoinGecko for crypto history")
}
