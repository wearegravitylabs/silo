package store

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source asset_lot.go -destination ./mock/mock_asset_lot.go -package mock AssetLotDatabase

// AssetLotDatabase defines all persistence operations for asset lots.
type AssetLotDatabase interface {
	CreateLot(ctx context.Context, lot model.AssetLot) (model.AssetLot, error)
	ListLotsByAsset(ctx context.Context, assetID uuid.UUID) ([]model.AssetLot, error)
	GetLotByID(ctx context.Context, id uuid.UUID) (model.AssetLot, error)
	DeleteLot(ctx context.Context, id uuid.UUID) error
	// SumQuantity returns the total quantity across all lots for an asset.
	SumQuantity(ctx context.Context, assetID uuid.UUID) (float64, error)
}

type assetLotStore struct{ storage *Store }

// NewAssetLotStore returns an AssetLotDatabase backed by the given Store.
func NewAssetLotStore(s *Store) AssetLotDatabase { return &assetLotStore{storage: s} }

// CreateLot persists a new lot and returns it with its generated ID.
func (a *assetLotStore) CreateLot(ctx context.Context, lot model.AssetLot) (model.AssetLot, error) {
	if err := a.storage.DB.WithContext(ctx).Create(&lot).Error; err != nil {
		return model.AssetLot{}, siloErrors.ErrGenericErr
	}
	return lot, nil
}

// ListLotsByAsset returns all lots for an asset ordered by acquisition date ascending.
func (a *assetLotStore) ListLotsByAsset(ctx context.Context, assetID uuid.UUID) ([]model.AssetLot, error) {
	var lots []model.AssetLot
	err := a.storage.DB.WithContext(ctx).
		Where("asset_id = ?", assetID).
		Order("acquisition_date ASC").
		Find(&lots).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return lots, nil
}

// GetLotByID fetches a single lot by its primary key.
func (a *assetLotStore) GetLotByID(ctx context.Context, id uuid.UUID) (model.AssetLot, error) {
	var lot model.AssetLot
	err := a.storage.DB.WithContext(ctx).Where("id = ?", id).First(&lot).Error
	if err == gorm.ErrRecordNotFound {
		return model.AssetLot{}, siloErrors.ErrAssetNotFound
	}
	if err != nil {
		return model.AssetLot{}, siloErrors.ErrGenericErr
	}
	return lot, nil
}

// DeleteLot hard-deletes a lot by ID.
func (a *assetLotStore) DeleteLot(ctx context.Context, id uuid.UUID) error {
	result := a.storage.DB.WithContext(ctx).Where("id = ?", id).Delete(&model.AssetLot{})
	if result.Error != nil {
		return siloErrors.ErrGenericErr
	}
	if result.RowsAffected == 0 {
		return siloErrors.ErrAssetNotFound
	}
	return nil
}

// SumQuantity returns the aggregate quantity of all lots for an asset.
func (a *assetLotStore) SumQuantity(ctx context.Context, assetID uuid.UUID) (float64, error) {
	var total float64
	err := a.storage.DB.WithContext(ctx).
		Model(&model.AssetLot{}).
		Select("COALESCE(SUM(quantity), 0)").
		Where("asset_id = ?", assetID).
		Scan(&total).Error
	return total, err
}
