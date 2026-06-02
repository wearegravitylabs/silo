// Package coingecko implements market.MarketDataProvider for cryptocurrency data.
package coingecko

import (
	"context"
	"fmt"

	"github.com/wearegravitylabs/silo/api/thirdparty/market"
)

// Client fetches crypto data from the CoinGecko API.
type Client struct {
	apiKey  string
	baseURL string
}

// New returns a CoinGecko market data client.
func New(apiKey, baseURL string) market.MarketDataProvider {
	if baseURL == "" {
		baseURL = "https://api.coingecko.com/api/v3"
	}
	return &Client{apiKey: apiKey, baseURL: baseURL}
}

func (c *Client) GetStockQuote(ctx context.Context, ticker string) (market.Quote, error) {
	return market.Quote{}, fmt.Errorf("coingecko: use Yahoo Finance for stock quotes")
}

func (c *Client) GetCryptoPrice(ctx context.Context, coinID, currency string) (market.Quote, error) {
	// TODO: implement /simple/price endpoint
	return market.Quote{}, fmt.Errorf("coingecko: GetCryptoPrice not yet implemented")
}

func (c *Client) GetExchangeRate(ctx context.Context, from, to string) (float64, error) {
	return 0, fmt.Errorf("coingecko: use ExchangeRate API for fiat FX")
}

func (c *Client) GetStockHistory(ctx context.Context, ticker string, period market.Period) ([]market.OHLCV, error) {
	return nil, fmt.Errorf("coingecko: use Yahoo Finance for stock history")
}

func (c *Client) GetCryptoHistory(ctx context.Context, coinID string, period market.Period) ([]market.OHLCV, error) {
	// TODO: implement /coins/{id}/ohlc endpoint
	return nil, fmt.Errorf("coingecko: GetCryptoHistory not yet implemented")
}
