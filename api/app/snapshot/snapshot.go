// Package snapshot implements point-in-time portfolio net worth capture.
package snapshot

import (
	"context"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/model"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

//go:generate mockgen -source snapshot.go -destination ../mock/snapshot/mock_snapshot.go -package snapshot Snapshot

// Snapshot defines snapshot capture and retrieval.
type Snapshot interface {
	// Capture computes and persists the current net worth for a portfolio.
	Capture(ctx context.Context, portfolioID uuid.UUID) (model.Snapshot, error)
	// List returns snapshots within the given time range.
	List(ctx context.Context, portfolioID uuid.UUID, from, to time.Time) ([]model.Snapshot, error)
	// Latest returns the most recent snapshot.
	Latest(ctx context.Context, portfolioID uuid.UUID) (model.Snapshot, error)
	// CaptureAll captures a snapshot for every live portfolio. It is the
	// daily scheduler job.
	CaptureAll(ctx context.Context) error
}

type service struct{ dp app.Dependency }

// New returns a Snapshot service.
func New(dp app.Dependency) Snapshot { return &service{dp: dp} }

// Capture sums the owned share of every asset and debt, converted to the
// portfolio's base currency at the cached daily rate, and saves it.
func (s *service) Capture(ctx context.Context, portfolioID uuid.UUID) (model.Snapshot, error) {
	portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, portfolioID)
	if err != nil {
		return model.Snapshot{}, err
	}
	assets, err := s.dp.AssetStore.ListAssetsByPortfolio(ctx, portfolioID, model.ListAssetsFilter{})
	if err != nil {
		return model.Snapshot{}, err
	}
	debts, err := s.dp.DebtStore.ListDebtsByPortfolio(ctx, portfolioID, model.ListDebtsFilter{})
	if err != nil {
		return model.Snapshot{}, err
	}

	base := portfolio.BaseCurrency
	rates := map[string]float64{}
	toBase := func(amount float64, from string) float64 {
		if from == "" || strings.EqualFold(from, base) {
			return amount
		}
		rate, ok := rates[from]
		if !ok {
			rate, err = s.dp.ExchangeRateStore.GetRate(ctx, from, base)
			if err != nil {
				log := siloLogger.FromCtx(ctx)
				log.Warn().Err(err).Str("from", from).Str("to", base).
					Msg("no FX rate for snapshot — counting at 1.0")
				rate = 1.0
			}
			rates[from] = rate
		}
		return amount * rate
	}

	var totalAssets, totalDebts float64
	byClass := map[string]float64{}
	for _, a := range assets {
		v := toBase(a.CurrentPrice*a.Quantity*a.OwnershipPct/100, a.Currency)
		totalAssets += v
		byClass[a.AssetClass] += v
	}
	for _, d := range debts {
		totalDebts += toBase(d.Balance*d.OwnershipPct/100, d.Currency)
	}

	allocation := model.JSONB{}
	for class, v := range byClass {
		allocation[class] = round2(v)
	}
	return s.dp.SnapshotStore.CreateSnapshot(ctx, model.Snapshot{
		PortfolioID: portfolioID,
		TotalAssets: round2(totalAssets),
		TotalDebts:  round2(totalDebts),
		NetWorth:    round2(totalAssets - totalDebts),
		Currency:    base,
		Allocation:  allocation,
		SnappedAt:   time.Now().UTC(),
	})
}

func (s *service) CaptureAll(ctx context.Context) error {
	log := siloLogger.FromCtx(ctx)
	ids, err := s.dp.PortfolioStore.ListLiveIDs(ctx)
	if err != nil {
		return err
	}
	failed := 0
	for _, id := range ids {
		if _, err := s.Capture(ctx, id); err != nil {
			failed++
			log.Error().Err(err).Str("portfolio_id", id.String()).Msg("failed to capture snapshot")
		}
	}
	log.Info().Int("portfolios", len(ids)).Int("failed", failed).Msg("snapshots captured")
	return nil
}

func round2(v float64) float64 { return math.Round(v*100) / 100 }

func (s *service) List(ctx context.Context, portfolioID uuid.UUID, from, to time.Time) ([]model.Snapshot, error) {
	return s.dp.SnapshotStore.ListSnapshotsByPortfolio(ctx, portfolioID, from, to)
}

func (s *service) Latest(ctx context.Context, portfolioID uuid.UUID) (model.Snapshot, error) {
	return s.dp.SnapshotStore.LatestSnapshot(ctx, portfolioID)
}
