package store

import (
	"context"
	"time"

	"github.com/google/uuid"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source snapshot.go -destination ./mock/mock_snapshot.go -package mock SnapshotDatabase

// SnapshotDatabase defines all persistence operations for portfolio snapshots.
type SnapshotDatabase interface {
	CreateSnapshot(ctx context.Context, snapshot model.Snapshot) (model.Snapshot, error)
	ListSnapshotsByPortfolio(ctx context.Context, portfolioID uuid.UUID, from, to time.Time) ([]model.Snapshot, error)
	LatestSnapshot(ctx context.Context, portfolioID uuid.UUID) (model.Snapshot, error)
	DeleteSnapshotsBefore(ctx context.Context, portfolioID uuid.UUID, before time.Time) error
}

type snapshotStore struct{ storage *Store }

// NewSnapshotStore returns a SnapshotDatabase backed by the given Store.
func NewSnapshotStore(s *Store) SnapshotDatabase { return &snapshotStore{storage: s} }

func (s *snapshotStore) CreateSnapshot(ctx context.Context, snapshot model.Snapshot) (model.Snapshot, error) {
	if err := s.storage.DB.WithContext(ctx).Create(&snapshot).Error; err != nil {
		return model.Snapshot{}, siloErrors.ErrGenericErr
	}
	return snapshot, nil
}

func (s *snapshotStore) ListSnapshotsByPortfolio(ctx context.Context, portfolioID uuid.UUID, from, to time.Time) ([]model.Snapshot, error) {
	var snapshots []model.Snapshot
	err := s.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND snapped_at BETWEEN ? AND ?", portfolioID, from, to).
		Order("snapped_at ASC").
		Find(&snapshots).Error
	return snapshots, err
}

func (s *snapshotStore) LatestSnapshot(ctx context.Context, portfolioID uuid.UUID) (model.Snapshot, error) {
	var snapshot model.Snapshot
	err := s.storage.DB.WithContext(ctx).
		Where("portfolio_id = ?", portfolioID).
		Order("snapped_at DESC").
		First(&snapshot).Error
	return snapshot, err
}

func (s *snapshotStore) DeleteSnapshotsBefore(ctx context.Context, portfolioID uuid.UUID, before time.Time) error {
	return s.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND snapped_at < ?", portfolioID, before).
		Delete(&model.Snapshot{}).Error
}
