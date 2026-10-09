// Package exchangerate refreshes the cached FX rate table from a third-party
// provider (see thirdparty/exchangerate) on a schedule.
package exchangerate

import (
	"context"
	"time"

	"github.com/wearegravitylabs/silo/api/app"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

//go:generate mockgen -source exchangerate.go -destination ../mock/exchangerate/mock_exchangerate.go -package exchangerate ExchangeRate

// anchorCurrency is the base every rate is fetched and stored against.
const anchorCurrency = "USD"

// ExchangeRate refreshes the cached FX rate table.
type ExchangeRate interface {
	// RefreshRates fetches the latest rate table and upserts it into the cache.
	// Called by a scheduler (see main.go); safe to call repeatedly / concurrently
	// with itself — it's a plain upsert, not a delta.
	RefreshRates(ctx context.Context) error
}

type service struct{ dp app.Dependency }

// New returns an ExchangeRate service.
func New(dp app.Dependency) ExchangeRate { return &service{dp: dp} }

func (s *service) RefreshRates(ctx context.Context) error {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "exchangerate.RefreshRates").
		Logger()

	rates, fetchedAt, err := s.dp.ExchangeRateProvider.GetLatestRates(ctx, anchorCurrency)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch FX rates")
		return err
	}

	if fetchedAt.IsZero() {
		fetchedAt = time.Now().UTC()
	}

	if err := s.dp.ExchangeRateStore.UpsertRates(ctx, anchorCurrency, rates, fetchedAt); err != nil {
		log.Error().Err(err).Msg("failed to store FX rates")
		return err
	}

	log.Info().Int("count", len(rates)).Msg("refreshed FX rate cache")
	return nil
}
