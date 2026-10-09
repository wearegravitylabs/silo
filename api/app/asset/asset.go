// Package asset implements asset tracking and price refresh logic.
package asset

import (
	"context"
	"errors"
	"math"
	"sort"
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
	"github.com/wearegravitylabs/silo/api/thirdparty/stocks"
)

//go:generate mockgen -source asset.go -destination ../mock/asset/mock_asset.go -package asset Asset

// Asset defines asset management operations.
type Asset interface {
	// SearchTicker searches for tickers matching the query.
	// tickerType filters by provider: "stock" (Yahoo only), "crypto" (CoinGecko only),
	// or "" (both, merged).
	// Used in the two-step ticker add flow before the user commits.
	SearchTicker(ctx context.Context, query, tickerType string) ([]market.TickerResult, error)
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
	// RefreshAllPrices updates the current price of every stock_ticker asset in
	// every portfolio from the market data provider and records a value-history
	// point for each. Run daily by the scheduler; a no-op without a provider.
	RefreshAllPrices(ctx context.Context) error

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

// SearchTicker searches for tickers matching the query.
// tickerType: "stock" → Yahoo Finance only, "crypto" → CoinGecko only, "" → both in parallel.
func (s *service) SearchTicker(ctx context.Context, query, tickerType string) ([]market.TickerResult, error) {
	switch strings.ToLower(tickerType) {
	case "stock":
		return s.dp.StockMarket.SearchTicker(ctx, query)
	case "crypto":
		return s.dp.CryptoMarket.SearchTicker(ctx, query)
	}

	// Both — run in parallel, merge stocks first then crypto.
	type result struct {
		items []market.TickerResult
		err   error
	}
	stockCh := make(chan result, 1)
	cryptoCh := make(chan result, 1)

	go func() {
		items, err := s.dp.StockMarket.SearchTicker(ctx, query)
		stockCh <- result{items, err}
	}()
	go func() {
		items, err := s.dp.CryptoMarket.SearchTicker(ctx, query)
		cryptoCh <- result{items, err}
	}()

	stocks := <-stockCh
	crypto := <-cryptoCh

	var combined []market.TickerResult
	if stocks.err == nil {
		combined = append(combined, stocks.items...)
	}
	if crypto.err == nil {
		combined = append(combined, crypto.items...)
	}
	if stocks.err != nil && crypto.err != nil {
		return nil, stocks.err
	}
	return combined, nil
}

// GetTickerPreview returns current quote data for a single ticker symbol.
func (s *service) GetTickerPreview(ctx context.Context, ticker string) (market.Quote, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.GetTickerPreview").
		Str("ticker", ticker).
		Logger()

	quote, err := s.dp.StockMarket.GetStockQuote(ctx, strings.ToUpper(strings.TrimSpace(ticker)))
	if err != nil {
		log.Error().Err(err).Msg("ticker preview failed")
		return market.Quote{}, siloErrors.ErrInvalidTicker
	}
	return quote, nil
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

	if err := validateLotPrices(req.AssetType, req.Lots); err != nil {
		return model.Asset{}, err
	}

	// Stocks priced by the market data provider: fix the market (country) and
	// price every lot up front, so a lookup failure leaves nothing half-created.
	var (
		country   stocks.Country
		lotDates  []*time.Time
		useStocks = req.AssetType == model.AssetTypeStockTicker && s.dp.Stocks != nil
	)
	if useStocks {
		country = stocks.CountryUS
		if strings.TrimSpace(req.Country) != "" {
			c, ok := stocks.ParseCountry(req.Country)
			if !ok {
				return model.Asset{}, siloErrors.ErrInvalidCountry
			}
			country = c
		}
		priced, dates, err := s.priceStockLots(ctx, country, req.Ticker, req.Lots)
		if err != nil {
			return model.Asset{}, err
		}
		req.Lots, lotDates = priced, dates
	}

	folder, err := s.dp.FolderStore.GetFolderByID(ctx, req.FolderID)
	if err != nil {
		return model.Asset{}, siloErrors.ErrFolderNotFound
	}
	if folder.PortfolioID != portfolioID {
		return model.Asset{}, siloErrors.ErrFolderNotFound
	}
	if folder.FolderType != model.FolderTypeAsset {
		return model.Asset{}, siloErrors.ErrFolderTypeMismatch
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
		id, err := s.upsertStockAsset(ctx, portfolioID, callerID, req, assetCurrency, investability, ownershipPct, classCode, country)
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
	for i, lotReq := range req.Lots {
		var priceDate *time.Time
		if lotDates != nil {
			priceDate = lotDates[i]
		}
		wg.Add(1)
		go func(lr model.CreateLotRequest, pd *time.Time) {
			defer wg.Done()
			if _, err := s.addLotInternal(ctx, assetID, req.AssetType, req.Ticker, lr, pd); err != nil {
				log.Error().Err(err).Msg("failed to add lot during asset creation")
				// Non-fatal — other lots still succeed.
			}
		}(lotReq, priceDate)
	}
	wg.Wait()

	// Sync total quantity from lots.
	if err := s.syncQuantity(ctx, assetID); err != nil {
		log.Error().Err(err).Msg("failed to sync quantity after lot creation")
	}

	if useStocks {
		s.recordStockHistory(ctx, assetID)
	}

	// For manual assets (real estate, physical, etc.) set current_price so that
	// total_value / owned_value are non-zero immediately after creation.
	// Priority: (1) explicit current_price from request, (2) first lot's acquisition_price.
	// Only ticker types auto-fetch price; all others need price seeding from request/lot.
	isManual := req.AssetType != model.AssetTypeStockTicker &&
		req.AssetType != model.AssetTypeCryptoTicker

	if isManual {
		asset, err := s.dp.AssetStore.GetAssetByID(ctx, assetID)
		if err == nil {
			lots, _ := s.dp.AssetLotStore.ListLotsByAsset(ctx, assetID)

			// Backfill a history entry per lot at the acquisition date, so the
			// value chart shows the asset's cost basis going back to purchase.
			for _, lot := range lots {
				if lot.AcquisitionPrice != nil && *lot.AcquisitionPrice > 0 {
					entry := model.AssetValueHistory{
						AssetID:    asset.ID,
						Value:      *lot.AcquisitionPrice * lot.Quantity,
						Currency:   asset.Currency,
						Source:     model.SourceManual,
						RecordedAt: lot.AcquisitionDate,
					}
					_, _ = s.dp.AssetValueHistStore.Create(ctx, entry)
				}
			}

			// Set current_price: explicit value from request, or fall back to
			// the first lot's acquisition price.
			var seedPrice float64
			if req.CurrentPrice != nil && *req.CurrentPrice > 0 {
				seedPrice = *req.CurrentPrice
			} else {
				for _, lot := range lots {
					if lot.AcquisitionPrice != nil && *lot.AcquisitionPrice > 0 {
						seedPrice = *lot.AcquisitionPrice
						break
					}
				}
			}
			if seedPrice > 0 && asset.CurrentPrice == 0 {
				asset.CurrentPrice = seedPrice
				if _, err := s.dp.AssetStore.UpdateAsset(ctx, asset); err == nil {
					// Record today's value as the current estimate.
					s.recordValueHistory(ctx, asset, model.SourceManual)
				}
			}
		}
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
	country stocks.Country, // empty => legacy Yahoo path (no market data provider configured)
) (uuid.UUID, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.upsertStockAsset").
		Str("ticker", req.Ticker).
		Logger()

	// For ticker-based stocks, check if the ticker already exists in this portfolio.
	if req.AssetType == model.AssetTypeStockTicker && req.Ticker != "" {
		ticker := strings.ToUpper(req.Ticker)
		if country != "" {
			ticker = stocks.NormalizeSymbol(country, req.Ticker)
		}
		existing, err := s.dp.AssetStore.GetByTicker(ctx, portfolioID, ticker)
		if err == nil {
			// Ticker already exists — return its ID so lots are appended.
			return existing.ID, nil
		}
		if !errors.Is(err, siloErrors.ErrAssetNotFound) {
			log.Error().Err(err).Msg("failed to check existing ticker")
			return uuid.Nil, err
		}

		// New ticker — fetch its quote. The market data provider also fixes the
		// asset's currency: an NGX stock is priced in NGN whatever the portfolio's
		// base currency is (conversion to the base currency happens on read).
		var (
			name, logoURL, assetCountry string
			price                       float64
			priceCurrency               = assetCurrency
		)
		if country != "" {
			q, err := s.dp.Stocks.Quote(ctx, country, ticker)
			if err != nil {
				return uuid.Nil, app.MapMarketError(err)
			}
			name, logoURL, price, priceCurrency, assetCountry = q.Name, q.LogoURL, q.Price, q.Currency, string(country)
		} else {
			q, err := s.dp.StockMarket.GetStockQuote(ctx, ticker)
			if err != nil {
				return uuid.Nil, siloErrors.ErrInvalidTicker
			}
			name, logoURL, price = q.CompanyName, q.LogoURL, q.Price
		}

		a := model.Asset{
			PortfolioID:   portfolioID,
			FolderID:      req.FolderID,
			Name:          helpers.Coalesce(req.Name, name),
			AssetType:     req.AssetType,
			AssetClass:    classCode,
			Ticker:        ticker,
			Country:       assetCountry,
			CurrentPrice:  price,
			Currency:      priceCurrency,
			OwnershipPct:  ownershipPct,
			Investability: investability,
			LogoURL:       logoURL,
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

	if err := validateLotPrices(asset.AssetType, []model.CreateLotRequest{req}); err != nil {
		return model.AssetLot{}, err
	}

	// Stocks priced by the market data provider: look up the price paid when the
	// caller didn't give one (failing with a clear error code if we can't).
	viaProvider := asset.AssetType == model.AssetTypeStockTicker && s.dp.Stocks != nil
	var priceDate *time.Time
	if viaProvider {
		price, used, err := s.stockLotPrice(ctx, stocks.CountryOrDefault(asset.Country), asset.Ticker, req)
		if err != nil {
			return model.AssetLot{}, err
		}
		if price != nil {
			req.AcquisitionPrice, priceDate = price, used
		}
	}

	lot, err := s.addLotInternal(ctx, assetID, asset.AssetType, asset.Ticker, req, priceDate)
	if err != nil {
		return model.AssetLot{}, err
	}

	_ = s.syncQuantity(ctx, assetID)
	if viaProvider {
		s.recordStockHistory(ctx, assetID)
	}
	return lot, nil
}

// stockLotPrice returns the price to record for a stock lot, or nil when the
// caller already supplied one. The lookup uses the closing price on the purchase
// date (or the trading day before it); a purchase made today uses the live quote.
// The second value is the trading day the price came from.
func (s *service) stockLotPrice(ctx context.Context, country stocks.Country, ticker string, lot model.CreateLotRequest) (*float64, *time.Time, error) {
	if lot.AcquisitionPrice != nil && *lot.AcquisitionPrice > 0 {
		return nil, nil, nil
	}
	price, used, err := s.dp.Stocks.PriceOn(ctx, country, ticker, lot.AcquisitionDate.Time())
	switch {
	case err == nil && price > 0:
		return &price, &used, nil
	case err == nil, errors.Is(err, stocks.ErrHistoryUnavailable):
		// No usable price (e.g. the plan has no history): the user has to supply it.
		return nil, nil, siloErrors.ErrAcquisitionPriceRequired
	default:
		return nil, nil, app.MapMarketError(err)
	}
}

// priceStockLots fills in the price of every lot that lacks one, returning a new
// slice (the input is untouched) and, per lot, the trading day its price came from.
func (s *service) priceStockLots(ctx context.Context, country stocks.Country, ticker string, lots []model.CreateLotRequest) ([]model.CreateLotRequest, []*time.Time, error) {
	out := make([]model.CreateLotRequest, len(lots))
	copy(out, lots)
	dates := make([]*time.Time, len(lots))
	for i := range out {
		price, used, err := s.stockLotPrice(ctx, country, stocks.NormalizeSymbol(country, ticker), out[i])
		if err != nil {
			return nil, nil, err
		}
		if price != nil {
			out[i].AcquisitionPrice, dates[i] = price, used
		}
	}
	return out, dates, nil
}

// recordStockHistory writes the sparse value-history points that make an asset's
// chart: one per purchase date (cumulative quantity held that day x the price
// paid) plus one for today at the current price. Days that already have a point
// are left alone, so it is safe to call after every lot is added. There is
// deliberately no day-by-day backfill: the daily price job fills in from today.
func (s *service) recordStockHistory(ctx context.Context, assetID uuid.UUID) {
	log := siloLogger.FromCtx(ctx)
	asset, err := s.dp.AssetStore.GetAssetByID(ctx, assetID)
	if err != nil {
		log.Error().Err(err).Msg("stock history: load asset")
		return
	}
	lots, err := s.dp.AssetLotStore.ListLotsByAsset(ctx, assetID)
	if err != nil || len(lots) == 0 {
		return
	}
	sort.Slice(lots, func(i, j int) bool { return lots[i].AcquisitionDate.Before(lots[j].AcquisitionDate) })

	now := time.Now().UTC()
	existing, _ := s.dp.AssetValueHistStore.ListByAsset(ctx, assetID, lots[0].AcquisitionDate.AddDate(0, 0, -1), now.Add(time.Hour))
	seen := make(map[string]bool, len(existing))
	for _, e := range existing {
		seen[e.RecordedAt.UTC().Format(dateKey)] = true
	}

	add := func(at time.Time, value float64) {
		day := at.UTC().Format(dateKey)
		if seen[day] {
			return
		}
		seen[day] = true
		_, _ = s.dp.AssetValueHistStore.Create(ctx, model.AssetValueHistory{
			AssetID: assetID, Value: round2(value), Currency: asset.Currency,
			Source: model.SourceTicker, RecordedAt: at,
		})
	}

	var held float64
	for _, l := range lots {
		held += l.Quantity
		if l.AcquisitionPrice != nil && *l.AcquisitionPrice > 0 {
			add(l.AcquisitionDate, held*(*l.AcquisitionPrice))
		}
	}
	if asset.CurrentPrice > 0 {
		add(now, asset.CurrentPrice*asset.Quantity)
	}
}

const dateKey = "2006-01-02"

// addLotInternal inserts a single lot. priceDate is the trading day the lot's
// price was looked up from (nil when the caller supplied the price).
func (s *service) addLotInternal(
	ctx context.Context,
	assetID uuid.UUID,
	assetType model.AssetType,
	ticker string,
	req model.CreateLotRequest,
	priceDate *time.Time,
) (model.AssetLot, error) {
	lot := model.AssetLot{
		AssetID:          assetID,
		Quantity:         req.Quantity,
		AcquisitionDate:  req.AcquisitionDate.Time(),
		AcquisitionPrice: req.AcquisitionPrice,
		PriceDateUsed:    priceDate,
		Notes:            req.Notes,
	}

	// Legacy path (no market data provider): fetch the historical close from
	// Yahoo unless the caller supplied a price.
	if (assetType == model.AssetTypeStockTicker) && s.dp.Stocks == nil && lot.AcquisitionPrice == nil && ticker != "" {
		price, dateUsed, err := s.dp.StockMarket.GetHistoricalPrice(ctx, strings.ToUpper(ticker), req.AcquisitionDate.Time())
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

	// Average cost per unit across every lot that has a price, so the average
	// price paid stays correct as lots are added or removed.
	if lots, lerr := s.dp.AssetLotStore.ListLotsByAsset(ctx, assetID); lerr == nil {
		var qty, cost float64
		for _, l := range lots {
			if l.AcquisitionPrice != nil && *l.AcquisitionPrice > 0 {
				qty += l.Quantity
				cost += l.Quantity * *l.AcquisitionPrice
			}
		}
		if qty > 0 {
			asset.PurchasePrice = cost / qty
		}
	}
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
			// Prefer the daily-cached rate (app/exchangerate) — no external call
			// on the request path. Fall back to a live lookup if the cache has
			// nothing for this pair yet (e.g. before the first refresh), then to
			// 1.0 if even that fails, same as the old behavior.
			rate, err := s.dp.ExchangeRateStore.GetRate(ctx, fromCur, to)
			if err != nil {
				rate, err = s.dp.StockMarket.GetExchangeRate(ctx, fromCur, to)
			}
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
	a.TotalCashInConverted = round2(a.TotalCashIn * rate)
	a.TotalCashOutConverted = round2(a.TotalCashOut * rate)
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

// RefreshAllPrices is the daily price job for stock_ticker assets: one current
// quote per distinct symbol, written to current_price, plus one value-history
// point (source=cron) per asset. Manual assets never come through here — they
// have no external price source, so their history is written on edit only.
//
// It is built to be cheap and to degrade gracefully:
//   - NGX assets are priced from a single cached call for the whole exchange.
//   - Symbols are de-duplicated across portfolios, so a stock held in many
//     portfolios costs one lookup.
//   - A symbol the provider no longer lists is skipped; the rest carry on.
//   - On a rate-limit, quota or outage error that market is abandoned for this
//     run (every further call would fail too) and the error is returned after
//     the other market has been tried, so the scheduler logs it.
func (s *service) RefreshAllPrices(ctx context.Context) error {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.RefreshAllPrices").
		Logger()

	if s.dp.Stocks == nil {
		log.Info().Msg("no market data provider configured, skipping price refresh")
		return nil
	}

	all, err := s.dp.AssetStore.ListAssetsWithTickers(ctx)
	if err != nil {
		return err
	}

	byCountry := map[stocks.Country][]model.Asset{}
	for _, a := range all {
		if a.AssetType == model.AssetTypeStockTicker {
			c := stocks.CountryOrDefault(a.Country)
			byCountry[c] = append(byCountry[c], a)
		}
	}

	var firstErr error
	var updated, missing int
	for country, group := range byCountry {
		symbols := make([]string, 0, len(group))
		seen := map[string]bool{}
		for _, a := range group {
			if !seen[a.Ticker] {
				seen[a.Ticker] = true
				symbols = append(symbols, a.Ticker)
			}
		}

		quotes, qerr := s.dp.Stocks.Quotes(ctx, country, symbols)
		if qerr != nil {
			log.Error().Err(qerr).Str("country", string(country)).Int("quoted", len(quotes)).Int("wanted", len(symbols)).
				Msg("price lookup failed part-way, keeping what was fetched")
			if firstErr == nil {
				firstErr = qerr
			}
		}

		now := time.Now().UTC()
		for _, a := range group {
			q, ok := quotes[a.Ticker]
			if !ok || q.Price <= 0 {
				missing++
				continue
			}
			a.CurrentPrice = q.Price
			a.LastPriceSync = &now
			a.UpdatedAt = now
			if _, uerr := s.dp.AssetStore.UpdateAsset(ctx, a); uerr != nil {
				log.Error().Err(uerr).Str("asset_id", a.ID.String()).Msg("failed to save refreshed price")
				continue
			}
			s.recordValueHistory(ctx, a, model.SourceCron)
			updated++
		}
	}

	log.Info().Int("updated", updated).Int("without_price", missing).Msg("stock prices refreshed")
	return firstErr
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

// requiresAcquisitionPrice reports whether lots for this asset type must carry an
// explicit acquisition_price. Only stock_ticker fetches a historical price
// automatically when the caller omits one (see addLotInternal) — every other
// type, ticker or not, has no such fallback, so an omitted price would silently
// leave the lot (and the asset's seeded current_price) at zero.
func requiresAcquisitionPrice(t model.AssetType) bool {
	return t != model.AssetTypeStockTicker
}

// validateLotPrices returns ErrAcquisitionPriceRequired if any lot omits acquisition_price
// for an asset type that has no automatic price-fetch fallback.
func validateLotPrices(assetType model.AssetType, lots []model.CreateLotRequest) error {
	if !requiresAcquisitionPrice(assetType) {
		return nil
	}
	for _, lot := range lots {
		if lot.AcquisitionPrice == nil || *lot.AcquisitionPrice <= 0 {
			return siloErrors.ErrAcquisitionPriceRequired
		}
	}
	return nil
}
