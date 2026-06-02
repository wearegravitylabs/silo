package store

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source asset.go -destination ./mock/mock_asset.go -package mock AssetDatabase

// AssetDatabase defines all persistence operations for assets.
type AssetDatabase interface {
	CreateAsset(ctx context.Context, asset model.Asset) (model.Asset, error)
	GetAssetByID(ctx context.Context, id uuid.UUID) (model.Asset, error)
	ListAssetsByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.Asset, error)
	UpdateAsset(ctx context.Context, asset model.Asset) (model.Asset, error)
	SoftDeleteAsset(ctx context.Context, id uuid.UUID) error
	ListAssetsWithTickers(ctx context.Context) ([]model.Asset, error)
}

type assetStore struct{ storage *Store }

// NewAssetStore returns an AssetDatabase backed by the given Store.
func NewAssetStore(s *Store) AssetDatabase { return &assetStore{storage: s} }

func (a *assetStore) CreateAsset(ctx context.Context, asset model.Asset) (model.Asset, error) {
	if err := a.storage.DB.WithContext(ctx).Create(&asset).Error; err != nil {
		return model.Asset{}, siloErrors.ErrGenericErr
	}
	return asset, nil
}

func (a *assetStore) GetAssetByID(ctx context.Context, id uuid.UUID) (model.Asset, error) {
	var asset model.Asset
	err := a.storage.DB.WithContext(ctx).Where("id = ? AND deleted_at IS NULL", id).First(&asset).Error
	if err == gorm.ErrRecordNotFound {
		return model.Asset{}, siloErrors.ErrAssetNotFound
	}
	if err != nil {
		return model.Asset{}, siloErrors.ErrGenericErr
	}
	return asset, nil
}

func (a *assetStore) ListAssetsByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.Asset, error) {
	var assets []model.Asset
	if err := a.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND deleted_at IS NULL", portfolioID).
		Order("created_at ASC").
		Find(&assets).Error; err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return assets, nil
}

func (a *assetStore) UpdateAsset(ctx context.Context, asset model.Asset) (model.Asset, error) {
	if err := a.storage.DB.WithContext(ctx).Save(&asset).Error; err != nil {
		return model.Asset{}, siloErrors.ErrGenericErr
	}
	return asset, nil
}

func (a *assetStore) SoftDeleteAsset(ctx context.Context, id uuid.UUID) error {
	return a.storage.DB.WithContext(ctx).
		Model(&model.Asset{}).
		Where("id = ?", id).
		Update("deleted_at", gorm.Expr("NOW()")).Error
}

func (a *assetStore) ListAssetsWithTickers(ctx context.Context) ([]model.Asset, error) {
	var assets []model.Asset
	err := a.storage.DB.WithContext(ctx).
		Where("ticker != '' AND deleted_at IS NULL").
		Find(&assets).Error
	return assets, err
}
