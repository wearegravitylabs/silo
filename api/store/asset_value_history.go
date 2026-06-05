package store

import (
	"context"
	"time"

	"github.com/google/uuid"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source asset_value_history.go -destination ./mock/mock_asset_value_history.go -package mock AssetValueHistoryDatabase

// AssetValueHistoryDatabase defines all persistence operations for asset value history.
type AssetValueHistoryDatabase interface {
	Create(ctx context.Context, entry model.AssetValueHistory) (model.AssetValueHistory, error)
	ListByAsset(ctx context.Context, assetID uuid.UUID, from, to time.Time) ([]model.AssetValueHistory, error)
	LatestByAsset(ctx context.Context, assetID uuid.UUID) (model.AssetValueHistory, error)
}

type assetValueHistStore struct{ storage *Store }

// NewAssetValueHistoryStore returns an AssetValueHistoryDatabase backed by the given Store.
func NewAssetValueHistoryStore(s *Store) AssetValueHistoryDatabase {
	return &assetValueHistStore{storage: s}
}

// Create persists a new value history entry.
func (a *assetValueHistStore) Create(ctx context.Context, entry model.AssetValueHistory) (model.AssetValueHistory, error) {
	if err := a.storage.DB.WithContext(ctx).Create(&entry).Error; err != nil {
		return model.AssetValueHistory{}, siloErrors.ErrGenericErr
	}
	return entry, nil
}

// ListByAsset returns value history entries for an asset within the given time range,
// ordered by recorded_at ascending (oldest first — suitable for charting).
func (a *assetValueHistStore) ListByAsset(ctx context.Context, assetID uuid.UUID, from, to time.Time) ([]model.AssetValueHistory, error) {
	var entries []model.AssetValueHistory
	err := a.storage.DB.WithContext(ctx).
		Where("asset_id = ? AND recorded_at BETWEEN ? AND ?", assetID, from, to).
		Order("recorded_at ASC").
		Find(&entries).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return entries, nil
}

// LatestByAsset returns the most recent value history entry for an asset.
func (a *assetValueHistStore) LatestByAsset(ctx context.Context, assetID uuid.UUID) (model.AssetValueHistory, error) {
	var entry model.AssetValueHistory
	err := a.storage.DB.WithContext(ctx).
		Where("asset_id = ?", assetID).
		Order("recorded_at DESC").
		First(&entry).Error
	if err != nil {
		return model.AssetValueHistory{}, siloErrors.ErrRecordNotFound
	}
	return entry, nil
}
