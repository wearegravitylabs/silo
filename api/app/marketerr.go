package app

import (
	"errors"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/thirdparty/stocks"
)

// MapMarketError converts a stocks.Provider error into the API error the
// frontend understands. Every code is distinct so the UI can react: retry
// shortly (rate limited), or fall back to manual price entry (quota/unavailable).
// Unknown errors are treated as the provider being unavailable.
func MapMarketError(err error) error {
	switch {
	case err == nil:
		return nil
	case errors.Is(err, stocks.ErrNotFound):
		return siloErrors.ErrInvalidTicker
	case errors.Is(err, stocks.ErrRateLimited):
		return siloErrors.ErrMarketRateLimited
	case errors.Is(err, stocks.ErrQuotaExceeded):
		return siloErrors.ErrMarketQuotaExceeded
	default:
		return siloErrors.ErrMarketUnavailable
	}
}
