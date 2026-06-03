// Package asset implements asset tracking and price refresh logic.
package asset

import (
	"context"
	"strings"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	"github.com/wearegravitylabs/silo/api/pkg/assetclass"
	"github.com/wearegravitylabs/silo/api/pkg/currency"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

//go:generate mockgen -source asset.go -destination ../mock/asset/mock_asset.go -package asset Asset

// Asset defines asset management operations.
type Asset interface {
	// Create adds a new asset to the portfolio. callerID is used to scope the
	// portfolio lookup (currency default) and for audit context. The portfolio's
	// base_currency is applied when the caller does not supply a currency.
	Create(ctx context.Context, portfolioID, callerID uuid.UUID, req model.CreateAssetRequest) (model.Asset, error)
	// GetByID fetches a single asset by its primary key.
	GetByID(ctx context.Context, id uuid.UUID) (model.Asset, error)
	// ListByPortfolio returns all non-deleted assets for a portfolio,
	// enriched with asset-class metadata (icon, class name, investability flag).
	ListByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.Asset, error)
	// Update applies partial changes to an asset.
	Update(ctx context.Context, id uuid.UUID, req model.UpdateAssetRequest) (model.Asset, error)
	// Delete soft-deletes an asset.
	Delete(ctx context.Context, id uuid.UUID) error
	// RefreshPrices fetches live prices for all ticker-based assets in the portfolio.
	RefreshPrices(ctx context.Context, portfolioID uuid.UUID) error
}

type service struct{ dp app.Dependency }

// New returns an Asset service.
func New(dp app.Dependency) Asset { return &service{dp: dp} }

// Create adds a new asset to a portfolio.
//
// Currency resolution order:
//  1. Use req.Currency if supplied and valid.
//  2. Fall back to the portfolio's BaseCurrency when req.Currency is empty.
//
// Investability resolution:
//   - Preset types (stocks, crypto, real estate, etc.) always use the registry value.
//   - Editable types (manual, domain) use req.Investability if supplied, or the
//     registry default when the caller omits it.
func (s *service) Create(ctx context.Context, portfolioID, callerID uuid.UUID, req model.CreateAssetRequest) (model.Asset, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.Create").
		Logger()

	// ── 1. Validate asset type ────────────────────────────────────────────────
	if !validAssetType(req.AssetType) {
		return model.Asset{}, siloErrors.ErrInvalidAssetType
	}

	// ── 2. Resolve currency ───────────────────────────────────────────────────
	assetCurrency := strings.ToUpper(strings.TrimSpace(req.Currency))
	if assetCurrency == "" {
		// Default to the portfolio's base currency.
		portfolio, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, portfolioID, callerID)
		if err != nil {
			log.Error().Err(err).Msg("failed to fetch portfolio for currency default")
			return model.Asset{}, err
		}
		assetCurrency = portfolio.BaseCurrency
	} else if !currency.IsValid(assetCurrency) {
		return model.Asset{}, siloErrors.ErrInvalidCurrency
	}

	// ── 3. Resolve investability ──────────────────────────────────────────────
	defaultInv, locked := assetclass.DefaultInvestability(req.AssetType)
	var investability model.Investability
	if locked {
		// Preset type — always use the registry value, ignore the request.
		investability = defaultInv
	} else {
		// Editable type — use caller's value if valid, else fall back to default.
		if req.Investability != "" {
			investability = req.Investability
		} else {
			investability = defaultInv
		}
	}

	// ── 4. Default ownership to 100 % ─────────────────────────────────────────
	ownershipPct := req.OwnershipPct
	if ownershipPct == 0 {
		ownershipPct = 100
	}

	// ── 5. Resolve folder (nil if not provided) ───────────────────────────────
	var folderID *uuid.UUID
	if req.FolderID != nil && *req.FolderID != uuid.Nil {
		folderID = req.FolderID
	}

	// ── 6. Build and persist ──────────────────────────────────────────────────
	asset := model.Asset{
		PortfolioID:     portfolioID,
		FolderID:        folderID,
		Name:            req.Name,
		AssetType:       req.AssetType,
		Ticker:          req.Ticker,
		Quantity:        req.Quantity,
		PurchasePrice:   req.PurchasePrice,
		CurrentPrice:    req.CurrentValue,
		Currency:        assetCurrency,
		OwnershipPct:    ownershipPct,
		Investability:   investability,
		Location:        req.Location,
		Metadata:        req.Metadata,
		AcquisitionDate: req.AcquisitionDate,
	}

	created, err := s.dp.AssetStore.CreateAsset(ctx, asset)
	if err != nil {
		log.Error().Err(err).Msg("failed to create asset")
		return model.Asset{}, err
	}

	// Enrich with asset-class metadata before returning.
	enrich(&created)

	log.Info().Str("asset_id", created.ID.String()).Msg("asset created")
	return created, nil
}

// GetByID fetches a single asset and enriches it with class metadata.
func (s *service) GetByID(ctx context.Context, id uuid.UUID) (model.Asset, error) {
	a, err := s.dp.AssetStore.GetAssetByID(ctx, id)
	if err != nil {
		return model.Asset{}, err
	}
	enrich(&a)
	return a, nil
}

// ListByPortfolio returns all assets for a portfolio with class metadata.
func (s *service) ListByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.Asset, error) {
	assets, err := s.dp.AssetStore.ListAssetsByPortfolio(ctx, portfolioID)
	if err != nil {
		return nil, err
	}
	for i := range assets {
		enrich(&assets[i])
	}
	return assets, nil
}

// Update applies partial changes to an existing asset.
func (s *service) Update(ctx context.Context, id uuid.UUID, req model.UpdateAssetRequest) (model.Asset, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.Update").
		Logger()

	a, err := s.dp.AssetStore.GetAssetByID(ctx, id)
	if err != nil {
		return model.Asset{}, err
	}

	if req.FolderID != nil {
		a.FolderID = req.FolderID
	}
	if req.Name != nil {
		a.Name = *req.Name
	}
	if req.Quantity != nil {
		a.Quantity = *req.Quantity
	}
	if req.CurrentPrice != nil {
		a.CurrentPrice = *req.CurrentPrice
	}
	if req.OwnershipPct != nil {
		a.OwnershipPct = *req.OwnershipPct
	}
	if req.Location != nil {
		a.Location = *req.Location
	}
	if req.Metadata != nil {
		a.Metadata = req.Metadata
	}
	// Only apply investability update when the type is editable.
	if req.Investability != nil && assetclass.InvestabilityEditable(a.AssetType) {
		a.Investability = *req.Investability
	}

	updated, err := s.dp.AssetStore.UpdateAsset(ctx, a)
	if err != nil {
		log.Error().Err(err).Msg("failed to update asset")
		return model.Asset{}, err
	}

	enrich(&updated)
	return updated, nil
}

// Delete soft-deletes an asset.
func (s *service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.dp.AssetStore.SoftDeleteAsset(ctx, id)
}

// RefreshPrices fetches live prices for all ticker-based assets in a portfolio.
func (s *service) RefreshPrices(ctx context.Context, portfolioID uuid.UUID) error {
	// TODO: batch-call market providers for all ticker-based assets
	panic("not implemented")
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// enrich populates the computed asset-class fields (Icon, AssetClassCode,
// AssetClassName, InvestabilityEditable) from the assetclass registry.
// These fields are not stored in the DB (gorm:"-") and must be set after every fetch.
func enrich(a *model.Asset) {
	class := assetclass.ClassOf(a.AssetType)
	a.AssetClassCode = class.Code
	a.AssetClassName = class.Name
	a.Icon = class.Icon
	a.InvestabilityEditable = assetclass.InvestabilityEditable(a.AssetType)
}

// validAssetType reports whether t is a recognised model.AssetType value.
func validAssetType(t model.AssetType) bool {
	switch t {
	case model.AssetTypeStockTicker, model.AssetTypeStockManual,
		model.AssetTypeCryptoTicker, model.AssetTypeCryptoManual,
		model.AssetTypeRealEstate, model.AssetTypeDomain,
		model.AssetTypePhysical, model.AssetTypeVC,
		model.AssetTypeBusiness, model.AssetTypeBank, model.AssetTypeManual:
		return true
	}
	return false
}
