package store

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

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

// CreateCashFlow persists a new cash flow entry and, in the same transaction,
// bumps the matching running total (total_cash_in or total_cash_out) on the
// parent asset — see the comment on those columns in model.Asset.
func (a *assetCashFlowStore) CreateCashFlow(ctx context.Context, flow model.AssetCashFlow) (model.AssetCashFlow, error) {
	column, err := totalColumnFor(flow.FlowType)
	if err != nil {
		return model.AssetCashFlow{}, err
	}

	err = a.storage.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&flow).Error; err != nil {
			return err
		}
		return tx.Model(&model.Asset{}).
			Where("id = ?", flow.AssetID).
			UpdateColumn(column, gorm.Expr(column+" + ?", flow.Amount)).Error
	})
	if err != nil {
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

// DeleteCashFlow hard-deletes a cash flow by ID and, in the same transaction,
// reverses its effect on the parent asset's running total.
func (a *assetCashFlowStore) DeleteCashFlow(ctx context.Context, id uuid.UUID) error {
	err := a.storage.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var flow model.AssetCashFlow
		if err := tx.Where("id = ?", id).First(&flow).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return siloErrors.ErrRecordNotFound
			}
			return err
		}

		result := tx.Where("id = ?", id).Delete(&model.AssetCashFlow{})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return siloErrors.ErrRecordNotFound
		}

		column, err := totalColumnFor(flow.FlowType)
		if err != nil {
			return err
		}
		return tx.Model(&model.Asset{}).
			Where("id = ?", flow.AssetID).
			UpdateColumn(column, gorm.Expr(column+" - ?", flow.Amount)).Error
	})
	if err == siloErrors.ErrRecordNotFound {
		return siloErrors.ErrRecordNotFound
	}
	if err != nil {
		return siloErrors.ErrGenericErr
	}
	return nil
}

// totalColumnFor maps a cash flow's direction to the assets column that
// tracks its running total. Built with fmt.Sprintf-free string literals
// (not user input) so it's safe to splice into gorm.Expr below.
func totalColumnFor(flowType model.CashFlowType) (string, error) {
	switch flowType {
	case model.CashFlowIn:
		return "total_cash_in", nil
	case model.CashFlowOut:
		return "total_cash_out", nil
	default:
		return "", fmt.Errorf("unknown cash flow type %q", flowType)
	}
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
