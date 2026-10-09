// Package stock serves the stock directory the UI browses when adding a stock asset.
package stock

import (
	"context"

	"github.com/wearegravitylabs/silo/api/app"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/thirdparty/stocks"
)

//go:generate mockgen -source stock.go -destination ../mock/stock/mock_stock.go -package stock Stock

// Stock lists listed stocks per market.
type Stock interface {
	// List returns one page of stocks (with current price and logo) for a market.
	// country must be "NG" or "US"; search matches symbol or company name.
	List(ctx context.Context, country, search string, page, limit int) (stocks.Page, error)
}

type service struct{ dp app.Dependency }

// New returns a Stock service.
func New(dp app.Dependency) Stock { return &service{dp: dp} }

func (s *service) List(ctx context.Context, country, search string, page, limit int) (stocks.Page, error) {
	c, ok := stocks.ParseCountry(country)
	if !ok {
		return stocks.Page{}, siloErrors.ErrInvalidCountry
	}
	if s.dp.Stocks == nil {
		// No NGNMARKET_API_KEY configured: tell the UI market data is unavailable
		// (so it can offer manual entry) rather than failing opaquely.
		return stocks.Page{}, siloErrors.ErrMarketUnavailable
	}
	p, err := s.dp.Stocks.List(ctx, stocks.ListParams{Country: c, Search: search, Page: page, Limit: limit})
	if err != nil {
		return stocks.Page{}, app.MapMarketError(err)
	}
	return p, nil
}
