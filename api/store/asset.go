package store

import (
	"context"
	"strings"

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
	// ListAssetsByPortfolio returns non-deleted assets for a portfolio with optional filtering.
	ListAssetsByPortfolio(ctx context.Context, portfolioID uuid.UUID, filter model.ListAssetsFilter) ([]model.Asset, error)
	UpdateAsset(ctx context.Context, asset model.Asset) (model.Asset, error)
	SoftDeleteAsset(ctx context.Context, id uuid.UUID) error
	ListAssetsWithTickers(ctx context.Context) ([]model.Asset, error)
	// GetByTicker returns the existing asset for a ticker in a portfolio, or
	// ErrAssetNotFound when no such asset exists.
	GetByTicker(ctx context.Context, portfolioID uuid.UUID, ticker string) (model.Asset, error)
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

// ListAssetsByPortfolio returns assets for a portfolio with optional filters applied.
//
//	GET /assets?class=stock&class=crypto   — multi-class OR filter
//	GET /assets?search=apple               — name / ticker partial match
//	GET /assets?investable=true            — cash + investable only
//	GET /assets?investable=false           — non_investable only
//	GET /assets?folder_id=<uuid>           — scoped to a folder
func (a *assetStore) ListAssetsByPortfolio(ctx context.Context, portfolioID uuid.UUID, filter model.ListAssetsFilter) ([]model.Asset, error) {
	q := a.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND deleted_at IS NULL", portfolioID)

	// Asset class filter — multiple classes are OR'd.
	if len(filter.Classes) > 0 {
		q = q.Where("asset_class IN ?", filter.Classes)
	}

	// Search — case-insensitive partial match on name or ticker.
	if filter.Search != "" {
		like := "%" + strings.ToLower(filter.Search) + "%"
		q = q.Where("LOWER(name) LIKE ? OR LOWER(ticker) LIKE ?", like, like)
	}

	// Investability boolean shorthand.
	if filter.Investable != nil {
		if *filter.Investable {
			q = q.Where("investability IN ?", []string{
				string(model.InvestabilityCash),
				string(model.InvestabilityInvestable),
			})
		} else {
			q = q.Where("investability = ?", model.InvestabilityNonInvest)
		}
	}

	// Folder filter.
	if filter.FolderID != nil {
		q = q.Where("folder_id = ?", *filter.FolderID)
	}

	// Sort order — direction defaults to ASC; NULLS LAST for nullable numeric columns.
	dir := "ASC"
	if strings.ToLower(filter.Order) == "desc" {
		dir = "DESC"
	}
	switch strings.ToLower(filter.Sort) {
	case "price":
		q = q.Order("current_price " + dir + " NULLS LAST")
	case "name":
		q = q.Order("LOWER(name) " + dir)
	case "created_at":
		q = q.Order("created_at " + dir)
	default:
		q = q.Order("created_at ASC")
	}

	var assets []model.Asset
	if err := q.Find(&assets).Error; err != nil {
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

// GetByTicker returns the (non-deleted) asset for a ticker within a portfolio.
// Returns ErrAssetNotFound when the ticker does not exist in that portfolio.
func (a *assetStore) GetByTicker(ctx context.Context, portfolioID uuid.UUID, ticker string) (model.Asset, error) {
	var asset model.Asset
	err := a.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND ticker = ? AND deleted_at IS NULL", portfolioID, ticker).
		Preload("Lots").
		First(&asset).Error
	if err == gorm.ErrRecordNotFound {
		return model.Asset{}, siloErrors.ErrAssetNotFound
	}
	if err != nil {
		return model.Asset{}, siloErrors.ErrGenericErr
	}
	return asset, nil
}
