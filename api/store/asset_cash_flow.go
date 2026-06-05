package store

import (
	"context"

	"github.com/google/uuid"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source asset_cash_flow.go -destination ./mock/mock_asset_cash_flow.go -package mock AssetCashFlowDatabase

// AssetCashFlowDatabase defines all persistence operations for asset cash flows.
type AssetCashFlowDatabase interface {
	CreateCashFlow(ctx context.Context, flow model.AssetCashFlow) (model.AssetCashFlow, error)
	ListByAsset(ctx context.Context, assetID uuid.UUID) ([]model.AssetCashFlow, error)
	DeleteCashFlow(ctx context.Context, id uuid.UUID) error
	// SumByType returns the total amount for all flows of the given type on an asset.
	SumByType(ctx context.Context, assetID uuid.UUID, flowType model.CashFlowType) (float64, error)
}

type assetCashFlowStore struct{ storage *Store }

// NewAssetCashFlowStore returns an AssetCashFlowDatabase backed by the given Store.
func NewAssetCashFlowStore(s *Store) AssetCashFlowDatabase {
	return &assetCashFlowStore{storage: s}
}

// CreateCashFlow persists a new cash flow entry.
func (a *assetCashFlowStore) CreateCashFlow(ctx context.Context, flow model.AssetCashFlow) (model.AssetCashFlow, error) {
	if err := a.storage.DB.WithContext(ctx).Create(&flow).Error; err != nil {
		return model.AssetCashFlow{}, siloErrors.ErrGenericErr
	}
	return flow, nil
}

// ListByAsset returns all cash flows for an asset ordered by flow_date descending.
func (a *assetCashFlowStore) ListByAsset(ctx context.Context, assetID uuid.UUID) ([]model.AssetCashFlow, error) {
	var flows []model.AssetCashFlow
	err := a.storage.DB.WithContext(ctx).
		Where("asset_id = ?", assetID).
		Order("flow_date DESC").
		Find(&flows).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return flows, nil
}

// DeleteCashFlow hard-deletes a cash flow by ID.
func (a *assetCashFlowStore) DeleteCashFlow(ctx context.Context, id uuid.UUID) error {
	result := a.storage.DB.WithContext(ctx).Where("id = ?", id).Delete(&model.AssetCashFlow{})
	if result.Error != nil {
		return siloErrors.ErrGenericErr
	}
	if result.RowsAffected == 0 {
		return siloErrors.ErrRecordNotFound
	}
	return nil
}

// SumByType returns the aggregate amount of all flows of a given type for an asset.
func (a *assetCashFlowStore) SumByType(ctx context.Context, assetID uuid.UUID, flowType model.CashFlowType) (float64, error) {
	var total float64
	err := a.storage.DB.WithContext(ctx).
		Model(&model.AssetCashFlow{}).
		Select("COALESCE(SUM(amount), 0)").
		Where("asset_id = ? AND flow_type = ?", assetID, flowType).
		Scan(&total).Error
	return total, err
}
