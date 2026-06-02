// Package asset implements asset tracking and price refresh logic.
package asset

import (
	"context"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source asset.go -destination ../mock/asset/mock_asset.go -package asset Asset

// Asset defines asset management operations.
type Asset interface {
	Create(ctx context.Context, portfolioID uuid.UUID, req model.CreateAssetRequest) (model.Asset, error)
	GetByID(ctx context.Context, id uuid.UUID) (model.Asset, error)
	ListByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.Asset, error)
	Update(ctx context.Context, id uuid.UUID, req model.UpdateAssetRequest) (model.Asset, error)
	Delete(ctx context.Context, id uuid.UUID) error
	// RefreshPrices fetches live prices for all ticker-based assets in the portfolio.
	RefreshPrices(ctx context.Context, portfolioID uuid.UUID) error
}

type service struct{ dp app.Dependency }

// New returns an Asset service.
func New(dp app.Dependency) Asset { return &service{dp: dp} }

func (s *service) Create(ctx context.Context, portfolioID uuid.UUID, req model.CreateAssetRequest) (model.Asset, error) {
	panic("not implemented")
}

func (s *service) GetByID(ctx context.Context, id uuid.UUID) (model.Asset, error) {
	return s.dp.AssetStore.GetAssetByID(ctx, id)
}

func (s *service) ListByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.Asset, error) {
	return s.dp.AssetStore.ListAssetsByPortfolio(ctx, portfolioID)
}

func (s *service) Update(ctx context.Context, id uuid.UUID, req model.UpdateAssetRequest) (model.Asset, error) {
	panic("not implemented")
}

func (s *service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.dp.AssetStore.SoftDeleteAsset(ctx, id)
}

func (s *service) RefreshPrices(ctx context.Context, portfolioID uuid.UUID) error {
	// TODO: fetch ticker assets, batch-call market providers, update current_price
	panic("not implemented")
}
