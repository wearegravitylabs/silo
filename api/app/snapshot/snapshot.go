// Package snapshot implements point-in-time portfolio net worth capture.
package snapshot

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/model"
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
}

type service struct{ dp app.Dependency }

// New returns a Snapshot service.
func New(dp app.Dependency) Snapshot { return &service{dp: dp} }

func (s *service) Capture(ctx context.Context, portfolioID uuid.UUID) (model.Snapshot, error) {
	// TODO: sum all asset values * ownership_pct, sum all debt balances, compute net worth, persist
	panic("not implemented")
}

func (s *service) List(ctx context.Context, portfolioID uuid.UUID, from, to time.Time) ([]model.Snapshot, error) {
	return s.dp.SnapshotStore.ListSnapshotsByPortfolio(ctx, portfolioID, from, to)
}

func (s *service) Latest(ctx context.Context, portfolioID uuid.UUID) (model.Snapshot, error) {
	return s.dp.SnapshotStore.LatestSnapshot(ctx, portfolioID)
}
