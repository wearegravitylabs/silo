// Package asset implements asset tracking and price refresh logic.
package asset

import (
	"context"
	"errors"
	"math"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	"github.com/wearegravitylabs/silo/api/pkg/assetclass"
	"github.com/wearegravitylabs/silo/api/pkg/currency"
	"github.com/wearegravitylabs/silo/api/pkg/helpers"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
	"github.com/wearegravitylabs/silo/api/pkg/physicalsubtype"
	"github.com/wearegravitylabs/silo/api/thirdparty/market"
)

//go:generate mockgen -source asset.go -destination ../mock/asset/mock_asset.go -package asset Asset

// Asset defines asset management operations.
type Asset interface {
	// SearchTicker validates a ticker and returns a live price preview.
	// Used in the two-step ticker add flow before the user commits.
	SearchTicker(ctx context.Context, query string) ([]market.TickerResult, error)
	// GetTickerPreview returns current quote data for a single ticker.
	GetTickerPreview(ctx context.Context, ticker string) (market.Quote, error)
	// Create adds a new asset (ticker or manual) to a portfolio with one or more lots.
	// For ticker types, same-portfolio deduplication is applied automatically.
	Create(ctx context.Context, portfolioID, callerID uuid.UUID, req model.CreateAssetRequest) (model.Asset, error)
	// GetByID fetches a single asset (with lots preloaded). callerID is used for audit logging.
	GetByID(ctx context.Context, id, callerID uuid.UUID) (model.Asset, error)
	// Overview returns aggregated metrics for all assets in a portfolio.
	// All monetary values are in the portfolio's base_currency.
	Overview(ctx context.Context, portfolioID, callerID uuid.UUID) (model.AssetOverview, error)
	// ListByPortfolio returns assets for a portfolio with optional filters.
	ListByPortfolio(ctx context.Context, portfolioID, callerID uuid.UUID, filter model.ListAssetsFilter) ([]model.Asset, error)
	// Update applies partial changes to an asset. callerID is used for audit logging.
	Update(ctx context.Context, id, callerID uuid.UUID, req model.UpdateAssetRequest) (model.Asset, error)
	// Delete soft-deletes an asset. callerID is used for audit logging.
	Delete(ctx context.Context, id, callerID uuid.UUID) error
	// AddLot appends a purchase lot to an existing asset.
	AddLot(ctx context.Context, assetID, callerID uuid.UUID, req model.CreateLotRequest) (model.AssetLot, error)
	// ListLots returns all lots for an asset ordered by acquisition date.
	ListLots(ctx context.Context, assetID, callerID uuid.UUID) ([]model.AssetLot, error)
	// DeleteLot removes a lot and updates the asset's total quantity.
	DeleteLot(ctx context.Context, assetID, callerID, lotID uuid.UUID) error
	// RefreshPrices fetches live prices for all ticker-based assets in the portfolio.
	RefreshPrices(ctx context.Context, portfolioID uuid.UUID) error

	// ── Cash flows ────────────────────────────────────────────────────────────

	// AddCashFlow records an income or expense event for an asset.
	AddCashFlow(ctx context.Context, assetID, callerID uuid.UUID, req model.CreateCashFlowRequest) (model.AssetCashFlow, error)
	// ListCashFlows returns all cash flows for an asset, newest first.
	ListCashFlows(ctx context.Context, assetID, callerID uuid.UUID) ([]model.AssetCashFlow, error)
	// DeleteCashFlow removes a cash flow entry.
	DeleteCashFlow(ctx context.Context, assetID, callerID, flowID uuid.UUID) error

	// ── Value history ─────────────────────────────────────────────────────────

	// ListValueHistory returns per-asset value snapshots within the time range.
	ListValueHistory(ctx context.Context, assetID, callerID uuid.UUID, from, to time.Time) ([]model.AssetValueHistory, error)

}

type service struct{ dp app.Dependency }

// New returns an Asset service.
func New(dp app.Dependency) Asset { return &service{dp: dp} }

// SearchTicker searches Yahoo Finance for tickers matching the query.
func (s *service) SearchTicker(ctx context.Context, query string) ([]market.TickerResult, error) {
	return s.dp.StockMarket.SearchTicker(ctx, query)
}

// GetTickerPreview returns current quote data for a single ticker symbol.
func (s *service) GetTickerPreview(ctx context.Context, ticker string) (market.Quote, error) {
	return s.dp.StockMarket.GetStockQuote(ctx, strings.ToUpper(strings.TrimSpace(ticker)))
}

// Create adds an asset and its initial lots to the portfolio.
//
// For stock_ticker:
//   - Validates the ticker via Yahoo Finance and fetches live quote data.
//   - If an asset with the same ticker already exists in the portfolio, new lots are
//     appended to it rather than creating a duplicate row.
//   - Historical prices are fetched for each lot's acquisition_date from Yahoo Finance.
//     If the date is a weekend or holiday, the nearest prior trading day is used.
//
// For stock_manual:
//   - Uses the caller-supplied name + price. No external API calls.
func (s *service) Create(ctx context.Context, portfolioID, callerID uuid.UUID, req model.CreateAssetRequest) (model.Asset, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.Create").
		Logger()

	if !validAssetType(req.AssetType) {
		return model.Asset{}, siloErrors.ErrInvalidAssetType
	}

	folder, err := s.dp.FolderStore.GetFolderByID(ctx, req.FolderID)
	if err != nil {
		return model.Asset{}, siloErrors.ErrFolderNotFound
	}
	if folder.PortfolioID != portfolioID {
		return model.Asset{}, siloErrors.ErrFolderNotFound
	}

	// Resolve currency — fall back to portfolio base currency when empty.
	assetCurrency := strings.ToUpper(strings.TrimSpace(req.Currency))
	if assetCurrency == "" {
		portfolio, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, portfolioID, callerID)
		if err != nil {
			return model.Asset{}, err
		}
		assetCurrency = portfolio.BaseCurrency
	} else if !currency.IsValid(assetCurrency) {
		return model.Asset{}, siloErrors.ErrInvalidCurrency
	}

	// Resolve investability.
	defaultInv, locked := assetclass.DefaultInvestability(req.AssetType)
	investability := req.Investability
	if locked {
		investability = defaultInv
	} else if investability == "" {
		investability = defaultInv
	}

	ownershipPct := req.OwnershipPct
	if ownershipPct == 0 {
		ownershipPct = 100
	}

	classCode := assetclass.ClassOf(req.AssetType).Code

	var assetID uuid.UUID

	switch {
	case req.AssetType == model.AssetTypeStockTicker || req.AssetType == model.AssetTypeStockManual:
		id, err := s.upsertStockAsset(ctx, portfolioID, callerID, req, assetCurrency, investability, ownershipPct, classCode)
		if err != nil {
			return model.Asset{}, err
		}
		assetID = id

	case req.AssetType == model.AssetTypeCryptoTicker || req.AssetType == model.AssetTypeCryptoManual:
		id, err := s.upsertCryptoAsset(ctx, portfolioID, req, assetCurrency, investability, ownershipPct, classCode)
		if err != nil {
			return model.Asset{}, err
		}
		assetID = id

	case req.AssetType == model.AssetTypePhysical:
		if req.Subtype == "" || !physicalsubtype.IsValid(req.Subtype) {
			return model.Asset{}, siloErrors.ErrInvalidPhysicalSubtype
		}
		id, err := s.createManualAsset(ctx, portfolioID, req, assetCurrency, investability, ownershipPct, classCode)
		if err != nil {
			return model.Asset{}, err
		}
		assetID = id

	default:
		// Domain, VC, Business, Manual, Bank, Real Estate — generic manual path.
		id, err := s.createManualAsset(ctx, portfolioID, req, assetCurrency, investability, ownershipPct, classCode)
		if err != nil {
			return model.Asset{}, err
		}
		assetID = id
	}

	// Insert lots concurrently — each ticker lot fetches a historical price via HTTP,
	// so parallel execution cuts wall-clock time from N×(fetch) to 1×(slowest fetch).
	// syncQuantity must run after ALL lots are written, hence the WaitGroup barrier.
	var wg sync.WaitGroup
	for _, lotReq := range req.Lots {
		wg.Add(1)
		go func(lr model.CreateLotRequest) {
			defer wg.Done()
			if _, err := s.addLotInternal(ctx, assetID, req.AssetType, req.Ticker, lr); err != nil {
				log.Error().Err(err).Msg("failed to add lot during asset creation")
				// Non-fatal — other lots still succeed.
			}
		}(lotReq)
	}
	wg.Wait()

	// Sync total quantity from lots.
	if err := s.syncQuantity(ctx, assetID); err != nil {
		log.Error().Err(err).Msg("failed to sync quantity after lot creation")
	}

	// Return the asset with lots preloaded.
	result, err := s.dp.AssetStore.GetAssetByID(ctx, assetID)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch asset after creation")
		return model.Asset{}, err
	}
	lots, _ := s.dp.AssetLotStore.ListLotsByAsset(ctx, assetID)
	result.Lots = lots
	enrich(&result)
	return result, nil
}

// upsertStockAsset creates a stock asset row or returns the ID of an existing one
// with the same ticker in the same portfolio.
func (s *service) upsertStockAsset(
	ctx context.Context,
	portfolioID, callerID uuid.UUID,
	req model.CreateAssetRequest,
	assetCurrency string,
	investability model.Investability,
	ownershipPct float64,
	classCode string,
) (uuid.UUID, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.upsertStockAsset").
		Str("ticker", req.Ticker).
		Logger()

	// For ticker-based stocks, check if the ticker already exists in this portfolio.
	if req.AssetType == model.AssetTypeStockTicker && req.Ticker != "" {
		existing, err := s.dp.AssetStore.GetByTicker(ctx, portfolioID, strings.ToUpper(req.Ticker))
		if err == nil {
			// Ticker already exists — return its ID so lots are appended.
			return existing.ID, nil
		}
		if !errors.Is(err, siloErrors.ErrAssetNotFound) {
			log.Error().Err(err).Msg("failed to check existing ticker")
			return uuid.Nil, err
		}

		// New ticker — fetch quote from Yahoo Finance.
		quote, err := s.dp.StockMarket.GetStockQuote(ctx, strings.ToUpper(req.Ticker))
		if err != nil {
			return uuid.Nil, siloErrors.ErrInvalidTicker
		}

		a := model.Asset{
			PortfolioID:   portfolioID,
			FolderID:      req.FolderID,
			Name:          helpers.Coalesce(req.Name, quote.CompanyName),
			AssetType:     req.AssetType,
			AssetClass:    classCode,
			Ticker:        strings.ToUpper(req.Ticker),
			CurrentPrice:  quote.Price,
			Currency:      assetCurrency,
			OwnershipPct:  ownershipPct,
			Investability: investability,
			LogoURL:       quote.LogoURL,
			Location:      req.Location,
			Metadata:      req.Metadata,
		}
		created, err := s.dp.AssetStore.CreateAsset(ctx, a)
		if err != nil {
			return uuid.Nil, err
		}
		return created.ID, nil
	}

	// Manual stock — always create a new row.
	a := model.Asset{
		PortfolioID:   portfolioID,
		FolderID:      req.FolderID,
		Name:          req.Name,
		AssetType:     req.AssetType,
		AssetClass:    classCode,
		Currency:      assetCurrency,
		OwnershipPct:  ownershipPct,
		Investability: investability,
		Location:      req.Location,
		Metadata:      req.Metadata,
	}
	if req.ImageURL != nil {
		a.LogoURL = *req.ImageURL
	}
	created, err := s.dp.AssetStore.CreateAsset(ctx, a)
	if err != nil {
		return uuid.Nil, err
	}
	return created.ID, nil
}

// ─── Lot management ───────────────────────────────────────────────────────────

// AddLot appends a purchase lot to an existing asset and syncs the total quantity.
func (s *service) AddLot(ctx context.Context, assetID, callerID uuid.UUID, req model.CreateLotRequest) (model.AssetLot, error) {
	asset, err := s.dp.AssetStore.GetAssetByID(ctx, assetID)
	if err != nil {
		return model.AssetLot{}, err
	}

	lot, err := s.addLotInternal(ctx, assetID, asset.AssetType, asset.Ticker, req)
	if err != nil {
		return model.AssetLot{}, err
	}

	_ = s.syncQuantity(ctx, assetID)
	return lot, nil
}

// addLotInternal inserts a single lot, fetching historical price from Yahoo when needed.
func (s *service) addLotInternal(
	ctx context.Context,
	assetID uuid.UUID,
	assetType model.AssetType,
	ticker string,
	req model.CreateLotRequest,
) (model.AssetLot, error) {
	lot := model.AssetLot{
		AssetID:          assetID,
		Quantity:         req.Quantity,
		AcquisitionDate:  req.AcquisitionDate,
		AcquisitionPrice: req.AcquisitionPrice,
		Notes:            req.Notes,
	}

	// For ticker-based assets, fetch the historical close price unless caller supplied one.
	if (assetType == model.AssetTypeStockTicker) && lot.AcquisitionPrice == nil && ticker != "" {
		price, dateUsed, err := s.dp.StockMarket.GetHistoricalPrice(ctx, strings.ToUpper(ticker), req.AcquisitionDate)
		if err == nil {
			lot.AcquisitionPrice = &price
			lot.PriceDateUsed = &dateUsed
		}
		// Non-fatal — save lot without price if fetch failed.
	}

	return s.dp.AssetLotStore.CreateLot(ctx, lot)
}

// ListLots returns all lots for an asset.
func (s *service) ListLots(ctx context.Context, assetID, callerID uuid.UUID) ([]model.AssetLot, error) {
	return s.dp.AssetLotStore.ListLotsByAsset(ctx, assetID)
}

// DeleteLot removes a lot and re-syncs the asset's total quantity.
func (s *service) DeleteLot(ctx context.Context, assetID, callerID, lotID uuid.UUID) error {
	if err := s.dp.AssetLotStore.DeleteLot(ctx, lotID); err != nil {
		return err
	}
	return s.syncQuantity(ctx, assetID)
}

// syncQuantity updates assets.quantity to the SUM of all its lots.
func (s *service) syncQuantity(ctx context.Context, assetID uuid.UUID) error {
	total, err := s.dp.AssetLotStore.SumQuantity(ctx, assetID)
	if err != nil {
		return err
	}
	asset, err := s.dp.AssetStore.GetAssetByID(ctx, assetID)
	if err != nil {
		return err
	}
	asset.Quantity = total
	_, err = s.dp.AssetStore.UpdateAsset(ctx, asset)
	return err
}

// ─── Standard CRUD ────────────────────────────────────────────────────────────

// GetByID fetches a single asset with lots preloaded and FX conversion applied.
func (s *service) GetByID(ctx context.Context, id, callerID uuid.UUID) (model.Asset, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.GetByID").
		Str("asset_id", id.String()).
		Logger()

	a, err := s.dp.AssetStore.GetAssetByID(ctx, id)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch asset")
		return model.Asset{}, err
	}

	lots, _ := s.dp.AssetLotStore.ListLotsByAsset(ctx, id)
	a.Lots = lots
	enrich(&a)

	// Fetch portfolio base_currency for FX conversion.
	portfolio, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, a.PortfolioID, callerID)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch portfolio for FX conversion")
		// Non-fatal — return asset without conversion.
		return a, nil
	}

	rateMap := s.fetchRateMap(ctx, []currency.Code{a.Currency}, portfolio.BaseCurrency)
	enrichWithFX(&a, portfolio.BaseCurrency, rateMap)
	return a, nil
}

// ListByPortfolio returns assets for a portfolio with FX conversion applied.
func (s *service) ListByPortfolio(ctx context.Context, portfolioID, callerID uuid.UUID, filter model.ListAssetsFilter) ([]model.Asset, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.ListByPortfolio").
		Str("portfolio_id", portfolioID.String()).
		Logger()

	// Fetch portfolio for base_currency.
	portfolio, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, portfolioID, callerID)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch portfolio for FX conversion")
		return nil, err
	}

	assets, err := s.dp.AssetStore.ListAssetsByPortfolio(ctx, portfolioID, filter)
	if err != nil {
		log.Error().Err(err).Msg("failed to list assets")
		return nil, err
	}

	// Collect unique native currencies and batch-fetch FX rates.
	nativeCurrencies := make([]currency.Code, 0, len(assets))
	seen := map[currency.Code]bool{}
	for _, a := range assets {
		if !seen[a.Currency] {
			nativeCurrencies = append(nativeCurrencies, a.Currency)
			seen[a.Currency] = true
		}
	}
	rateMap := s.fetchRateMap(ctx, nativeCurrencies, portfolio.BaseCurrency)

	for i := range assets {
		enrich(&assets[i])
		enrichWithFX(&assets[i], portfolio.BaseCurrency, rateMap)
	}
	return assets, nil
}

// fetchRateMap concurrently fetches FX rates for all provided native currencies
// to the target currency. Returns a map keyed as "FROM:TO".
func (s *service) fetchRateMap(ctx context.Context, from []currency.Code, to currency.Code) map[string]float64 {
	log := siloLogger.FromCtx(ctx)
	rateMap := make(map[string]float64, len(from))

	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, f := range from {
		if strings.EqualFold(f, to) {
			rateMap[f+":"+to] = 1.0
			continue
		}
		wg.Add(1)
		go func(fromCur currency.Code) {
			defer wg.Done()
			rate, err := s.dp.StockMarket.GetExchangeRate(ctx, fromCur, to)
			if err != nil {
				log.Warn().Err(err).
					Str("from", fromCur).Str("to", to).
					Msg("FX rate lookup failed — falling back to 1.0")
				rate = 1.0
			}
			mu.Lock()
			rateMap[fromCur+":"+to] = rate
			mu.Unlock()
		}(f)
	}
	wg.Wait()
	return rateMap
}

// enrichWithFX populates the FX conversion fields on an asset.
func enrichWithFX(a *model.Asset, baseCurrency currency.Code, rateMap map[string]float64) {
	rate := rateMap[a.Currency+":"+baseCurrency]
	if rate == 0 {
		rate = 1.0 // fallback: show in native currency
	}
	a.OwnedValueConverted = a.OwnedValue * rate
	a.ConvertedCurrency = baseCurrency
	a.ExchangeRate = rate
}

// ─── Overview ─────────────────────────────────────────────────────────────────

// Overview returns aggregated asset metrics for a portfolio in its base_currency.
func (s *service) Overview(ctx context.Context, portfolioID, callerID uuid.UUID) (model.AssetOverview, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.Overview").
		Str("portfolio_id", portfolioID.String()).
		Logger()

	portfolio, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, portfolioID, callerID)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch portfolio for overview")
		return model.AssetOverview{}, err
	}
	baseCurrency := portfolio.BaseCurrency

	assets, err := s.dp.AssetStore.ListAssetsByPortfolio(ctx, portfolioID, model.ListAssetsFilter{})
	if err != nil {
		log.Error().Err(err).Msg("failed to list assets for overview")
		return model.AssetOverview{}, err
	}

	// Collect unique native currencies and batch-fetch FX rates once.
	nativeCurrencies := uniqueCurrencies(assets)
	rateMap := s.fetchRateMap(ctx, nativeCurrencies, baseCurrency)

	// Enrich assets and aggregate buckets.
	var (
		totalValue    float64
		investable    float64
		nonInvestable float64
		investCount   int
		nonInvCount   int
	)

	cutoff := time.Now().UTC().AddDate(0, 0, -30)
	var historical30d float64

	for i := range assets {
		enrich(&assets[i])
		enrichWithFX(&assets[i], baseCurrency, rateMap)
		a := &assets[i]

		totalValue += a.OwnedValueConverted

		switch a.Investability {
		case model.InvestabilityCash, model.InvestabilityInvestable:
			investable += a.OwnedValueConverted
			investCount++
		case model.InvestabilityNonInvest:
			nonInvestable += a.OwnedValueConverted
			nonInvCount++
		}

		// Historical value for 30d growth.
		historical30d += s.historicalValue(ctx, a, cutoff, rateMap)
	}

	growth := totalValue - historical30d
	var growthPct float64
	if historical30d > 0 {
		growthPct = (growth / historical30d) * 100
	}

	return model.AssetOverview{
		Currency: baseCurrency,
		TotalAssets: model.OverviewBucket{
			Value: round2(totalValue),
			Count: len(assets),
		},
		Growth30d: model.OverviewGrowth{
			Amount:     round2(growth),
			Percentage: round2(growthPct),
		},
		Investable: model.OverviewBucket{
			Value: round2(investable),
			Count: investCount,
		},
		NonInvestable: model.OverviewBucket{
			Value: round2(nonInvestable),
			Count: nonInvCount,
		},
	}, nil
}

// historicalValue returns the best estimate of an asset's owned_value 30 days ago,
// converted to the display currency using today's FX rates.
// Priority: (1) asset_value_history, (2) cost basis from lots, (3) 0.
func (s *service) historicalValue(ctx context.Context, a *model.Asset, before time.Time, rateMap map[string]float64) float64 {
	// Try value history first.
	hist, err := s.dp.AssetValueHistStore.LatestByAssetBefore(ctx, a.ID, before)
	if err == nil {
		ownedNative := hist.Value * (a.OwnershipPct / 100.0)
		rate := rateMap[a.Currency+":"+a.ConvertedCurrency]
		if rate == 0 {
			rate = 1.0
		}
		return ownedNative * rate
	}

	// Fall back to cost basis (total acquisition cost from lots).
	lots, err := s.dp.AssetLotStore.ListLotsByAsset(ctx, a.ID)
	if err != nil || len(lots) == 0 {
		return 0
	}
	var costBasis float64
	for _, lot := range lots {
		if lot.AcquisitionPrice != nil {
			costBasis += lot.Quantity * *lot.AcquisitionPrice
		}
	}
	ownedCostBasis := costBasis * (a.OwnershipPct / 100.0)
	rate := rateMap[a.Currency+":"+a.ConvertedCurrency]
	if rate == 0 {
		rate = 1.0
	}
	return ownedCostBasis * rate
}

// uniqueCurrencies extracts the set of distinct currency codes from a slice of assets.
func uniqueCurrencies(assets []model.Asset) []currency.Code {
	seen := map[currency.Code]bool{}
	out := make([]currency.Code, 0)
	for _, a := range assets {
		if !seen[a.Currency] {
			out = append(out, a.Currency)
			seen[a.Currency] = true
		}
	}
	return out
}

// round2 rounds a float64 to 2 decimal places.
func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

// Update applies partial changes to an existing asset.
func (s *service) Update(ctx context.Context, id, callerID uuid.UUID, req model.UpdateAssetRequest) (model.Asset, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.Update").
		Logger()

	a, err := s.dp.AssetStore.GetAssetByID(ctx, id)
	if err != nil {
		return model.Asset{}, err
	}

	if req.FolderID != nil {
		a.FolderID = *req.FolderID
	}
	if req.Name != nil {
		a.Name = *req.Name
	}
	priceChanged := req.CurrentPrice != nil && *req.CurrentPrice != a.CurrentPrice
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
	if req.Investability != nil && assetclass.InvestabilityEditable(a.AssetType) {
		a.Investability = *req.Investability
	}

	updated, err := s.dp.AssetStore.UpdateAsset(ctx, a)
	if err != nil {
		log.Error().Err(err).Msg("failed to update asset")
		return model.Asset{}, err
	}

	// Auto-record a value history entry whenever the user manually changes the price.
	if priceChanged {
		s.recordValueHistory(ctx, updated, model.SourceManual)
	}

	enrich(&updated)
	return updated, nil
}

// Delete soft-deletes an asset.
func (s *service) Delete(ctx context.Context, id, callerID uuid.UUID) error {
	return s.dp.AssetStore.SoftDeleteAsset(ctx, id)
}

// RefreshPrices fetches live prices for all ticker-based assets in a portfolio.
func (s *service) RefreshPrices(ctx context.Context, portfolioID uuid.UUID) error {
	// TODO: batch-call market providers, update current_price for each ticker asset
	panic("not implemented")
}

// ─── Crypto upsert ────────────────────────────────────────────────────────────

// upsertCryptoAsset creates or deduplicates a crypto position by coin ID.
func (s *service) upsertCryptoAsset(
	ctx context.Context,
	portfolioID uuid.UUID,
	req model.CreateAssetRequest,
	assetCurrency string,
	investability model.Investability,
	ownershipPct float64,
	classCode string,
) (uuid.UUID, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.upsertCryptoAsset").
		Str("coin_id", req.Ticker).
		Logger()

	if req.AssetType == model.AssetTypeCryptoTicker && req.Ticker != "" {
		coinID := strings.ToLower(strings.TrimSpace(req.Ticker))

		// Dedup: return existing asset if this coin is already in the portfolio.
		existing, err := s.dp.AssetStore.GetByTicker(ctx, portfolioID, coinID)
		if err == nil {
			return existing.ID, nil
		}
		if !errors.Is(err, siloErrors.ErrAssetNotFound) {
			log.Error().Err(err).Msg("failed to check existing coin")
			return uuid.Nil, err
		}

		// New coin — fetch current price from CoinGecko.
		quote, err := s.dp.CryptoMarket.GetCryptoPrice(ctx, coinID, strings.ToLower(assetCurrency))
		if err != nil {
			return uuid.Nil, siloErrors.ErrInvalidTicker
		}

		a := model.Asset{
			PortfolioID:   portfolioID,
			FolderID:      req.FolderID,
			Name:          helpers.Coalesce(req.Name, quote.CompanyName, coinID),
			AssetType:     req.AssetType,
			AssetClass:    classCode,
			Ticker:        coinID,
			CurrentPrice:  quote.Price,
			Currency:      assetCurrency,
			OwnershipPct:  ownershipPct,
			Investability: investability,
			Metadata:      req.Metadata,
		}
		created, err := s.dp.AssetStore.CreateAsset(ctx, a)
		if err != nil {
			return uuid.Nil, err
		}
		return created.ID, nil
	}

	// Manual crypto — always create new.
	return s.createManualAsset(ctx, portfolioID, req, assetCurrency, investability, ownershipPct, classCode)
}

// createManualAsset creates a new asset row for any non-ticker type.
func (s *service) createManualAsset(
	ctx context.Context,
	portfolioID uuid.UUID,
	req model.CreateAssetRequest,
	assetCurrency string,
	investability model.Investability,
	ownershipPct float64,
	classCode string,
) (uuid.UUID, error) {
	a := model.Asset{
		PortfolioID:   portfolioID,
		FolderID:      req.FolderID,
		Name:          req.Name,
		AssetType:     req.AssetType,
		AssetClass:    classCode,
		Subtype:       req.Subtype,
		Currency:      assetCurrency,
		OwnershipPct:  ownershipPct,
		Investability: investability,
		Location:      req.Location,
		Metadata:      req.Metadata,
	}
	if req.ImageURL != nil {
		a.LogoURL = *req.ImageURL
	}
	created, err := s.dp.AssetStore.CreateAsset(ctx, a)
	if err != nil {
		return uuid.Nil, err
	}
	return created.ID, nil
}

// ─── Cash flows ───────────────────────────────────────────────────────────────

// AddCashFlow records an income or expense event for an asset.
func (s *service) AddCashFlow(ctx context.Context, assetID, callerID uuid.UUID, req model.CreateCashFlowRequest) (model.AssetCashFlow, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.AddCashFlow").
		Logger()

	asset, err := s.dp.AssetStore.GetAssetByID(ctx, assetID)
	if err != nil {
		return model.AssetCashFlow{}, err
	}

	cur := req.Currency
	if cur == "" {
		cur = asset.Currency
	}

	flow := model.AssetCashFlow{
		AssetID:  assetID,
		FlowType: req.FlowType,
		Category: req.Category,
		Amount:   req.Amount,
		Currency: cur,
		FlowDate: req.FlowDate,
		Notes:    req.Notes,
	}

	created, err := s.dp.AssetCashFlowStore.CreateCashFlow(ctx, flow)
	if err != nil {
		log.Error().Err(err).Msg("failed to create cash flow")
		return model.AssetCashFlow{}, err
	}
	return created, nil
}

// ListCashFlows returns all cash flows for an asset.
func (s *service) ListCashFlows(ctx context.Context, assetID, callerID uuid.UUID) ([]model.AssetCashFlow, error) {
	return s.dp.AssetCashFlowStore.ListByAsset(ctx, assetID)
}

// DeleteCashFlow removes a cash flow entry.
func (s *service) DeleteCashFlow(ctx context.Context, assetID, callerID, flowID uuid.UUID) error {
	return s.dp.AssetCashFlowStore.DeleteCashFlow(ctx, flowID)
}

// ─── Value history ────────────────────────────────────────────────────────────

// ListValueHistory returns per-asset value snapshots within the time range.
func (s *service) ListValueHistory(ctx context.Context, assetID, callerID uuid.UUID, from, to time.Time) ([]model.AssetValueHistory, error) {
	return s.dp.AssetValueHistStore.ListByAsset(ctx, assetID, from, to)
}

// recordValueHistory writes a value history snapshot for an asset.
// Called automatically when current_price is updated manually.
func (s *service) recordValueHistory(ctx context.Context, a model.Asset, src model.ValueHistorySource) {
	entry := model.AssetValueHistory{
		AssetID:    a.ID,
		Value:      a.CurrentPrice * a.Quantity,
		Currency:   a.Currency,
		Source:     src,
		RecordedAt: time.Now().UTC(),
	}
	if _, err := s.dp.AssetValueHistStore.Create(ctx, entry); err != nil {
		log := siloLogger.FromCtx(ctx)
		log.Error().Err(err).Str("asset_id", a.ID.String()).Msg("failed to record value history")
	}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// enrich populates all computed fields on an asset after a DB fetch.
func enrich(a *model.Asset) {
	// Asset-class display metadata from the in-memory registry.
	class := assetclass.ClassOf(a.AssetType)
	a.Icon = class.Icon
	a.InvestabilityEditable = assetclass.InvestabilityEditable(a.AssetType)

	// Ownership-adjusted values — saves the FE from having to multiply every time.
	a.TotalValue = a.CurrentPrice * a.Quantity
	a.OwnedValue = a.TotalValue * (a.OwnershipPct / 100.0)
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
