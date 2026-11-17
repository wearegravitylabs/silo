// Package asset implements asset tracking and price refresh logic.
package asset

import (
	"context"
	"errors"
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/app/fx"
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
	// Sell removes sold units from the oldest lots first, records the money as
	// a sale_proceeds cash flow and the remaining value on the sale date.
	Sell(ctx context.Context, assetID uuid.UUID, req model.SellAssetRequest) (model.SellAssetResult, error)
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

	if err := s.checkFolder(ctx, req.FolderID, portfolioID); err != nil {
		return model.Asset{}, err
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
			// value chart goes back to purchase: everything held that day,
			// valued at that lot's price.
			var held float64
			for _, lot := range lots {
				held += lot.Quantity
				if lot.AcquisitionPrice != nil && *lot.AcquisitionPrice > 0 {
					entry := model.AssetValueHistory{
						AssetID:    asset.ID,
						Value:      *lot.AcquisitionPrice * held,
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
	return s.present(ctx, result)
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
			FolderID:      &req.FolderID,
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
		FolderID:      &req.FolderID,
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

// Sell removes sold units from the asset's lots, oldest first (FIFO).
func (s *service) Sell(ctx context.Context, assetID uuid.UUID, req model.SellAssetRequest) (model.SellAssetResult, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.Sell").
		Str("asset_id", assetID.String()).
		Logger()

	at, err := pastOrToday(&req.Date)
	if err != nil {
		return model.SellAssetResult{}, err
	}
	a, err := s.dp.AssetStore.GetAssetByID(ctx, assetID)
	if err != nil {
		return model.SellAssetResult{}, err
	}
	lots, err := s.dp.AssetLotStore.ListLotsByAsset(ctx, assetID)
	if err != nil {
		return model.SellAssetResult{}, err
	}
	var held float64
	for _, l := range lots {
		held += l.Quantity
	}
	// Small tolerance so selling "everything" never fails on float rounding.
	if req.Quantity > held+1e-9 {
		return model.SellAssetResult{}, siloErrors.ErrSellExceedsHolding
	}

	price, err := s.salePrice(ctx, a, req)
	if err != nil {
		return model.SellAssetResult{}, err
	}

	// Take the units from the oldest lots first.
	left, cost := req.Quantity, 0.0
	for _, l := range lots {
		if left <= 1e-9 {
			break
		}
		take := math.Min(l.Quantity, left)
		if l.AcquisitionPrice != nil {
			cost += take * *l.AcquisitionPrice
		}
		if l.Quantity-take <= 1e-9 {
			err = s.dp.AssetLotStore.DeleteLot(ctx, l.ID)
		} else {
			err = s.dp.AssetLotStore.UpdateLotQuantity(ctx, l.ID, l.Quantity-take)
		}
		if err != nil {
			log.Error().Err(err).Msg("failed to reduce lot")
			return model.SellAssetResult{}, err
		}
		left -= take
	}
	if err := s.syncQuantity(ctx, assetID); err != nil {
		return model.SellAssetResult{}, err
	}

	proceeds := round2(req.Quantity * price)
	notes := req.Notes
	if notes == "" {
		notes = fmt.Sprintf("Sold %s units", strconv.FormatFloat(req.Quantity, 'f', -1, 64))
	}
	if _, err := s.dp.AssetCashFlowStore.CreateCashFlow(ctx, model.AssetCashFlow{
		AssetID:  assetID,
		FlowType: model.CashFlowIn,
		Category: model.CategorySaleProceeds,
		Amount:   proceeds,
		Currency: a.Currency,
		FlowDate: model.StartOfDay(at),
		Notes:    notes,
	}); err != nil {
		log.Error().Err(err).Msg("failed to record sale proceeds")
		return model.SellAssetResult{}, err
	}

	// What is left, valued at the sale price on the sale date.
	updated, err := s.dp.AssetStore.GetAssetByID(ctx, assetID)
	if err != nil {
		return model.SellAssetResult{}, err
	}
	if s.isNewest(ctx, assetID, at) && updated.CurrentPrice != price {
		updated.CurrentPrice = price
		if updated, err = s.dp.AssetStore.UpdateAsset(ctx, updated); err != nil {
			return model.SellAssetResult{}, err
		}
	}
	s.recordValueAt(ctx, updated, price, at)

	presented, err := s.present(ctx, updated)
	if err != nil {
		return model.SellAssetResult{}, err
	}
	log.Info().Float64("quantity", req.Quantity).Msg("asset units sold")
	return model.SellAssetResult{
		Asset:        presented,
		Proceeds:     proceeds,
		CostOfSold:   round2(cost),
		RealizedGain: round2(proceeds - cost),
		Currency:     a.Currency,
	}, nil
}

// salePrice is the price per unit of a sale: the one sent, or for a
// stock_ticker the market price on the sale date.
func (s *service) salePrice(ctx context.Context, a model.Asset, req model.SellAssetRequest) (float64, error) {
	if req.Price != nil {
		if *req.Price < 0 {
			return 0, siloErrors.ErrInvalidRequest
		}
		return *req.Price, nil
	}
	if a.AssetType != model.AssetTypeStockTicker || s.dp.Stocks == nil {
		return 0, siloErrors.ErrAcquisitionPriceRequired
	}
	price, _, err := s.stockLotPrice(ctx, stocks.CountryOrDefault(a.Country), a.Ticker,
		model.CreateLotRequest{Quantity: req.Quantity, AcquisitionDate: req.Date})
	if err != nil {
		return 0, err
	}
	return *price, nil
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
	return s.present(ctx, a)
}

// present returns one asset as the API shows it: with its lots, converted to
// the portfolio's base currency, and with gain and 1-month change filled in.
func (s *service) present(ctx context.Context, a model.Asset) (model.Asset, error) {
	portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, a.PortfolioID)
	if err != nil {
		return model.Asset{}, err
	}
	list := []model.Asset{a}
	if err := s.enrichAll(ctx, list, fx.New(s.dp, portfolio.BaseCurrency)); err != nil {
		return model.Asset{}, err
	}
	lots, _ := s.dp.AssetLotStore.ListLotsByAsset(ctx, a.ID)
	list[0].Lots = lots
	return list[0], nil
}

// ListByPortfolio returns assets for a portfolio with FX conversion applied.
func (s *service) ListByPortfolio(ctx context.Context, portfolioID, callerID uuid.UUID, filter model.ListAssetsFilter) ([]model.Asset, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "asset.ListByPortfolio").
		Str("portfolio_id", portfolioID.String()).
		Logger()

	portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, portfolioID)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch portfolio for FX conversion")
		return nil, err
	}

	assets, err := s.dp.AssetStore.ListAssetsByPortfolio(ctx, portfolioID, filter)
	if err != nil {
		log.Error().Err(err).Msg("failed to list assets")
		return nil, err
	}
	if err := s.enrichAll(ctx, assets, fx.New(s.dp, portfolio.BaseCurrency)); err != nil {
		return nil, err
	}
	return assets, nil
}

// EnrichAll fills the computed fields on assets loaded straight from the
// store (see enrichAll). The dashboard uses it so both show the same numbers.
func EnrichAll(ctx context.Context, dp app.Dependency, assets []model.Asset, conv *fx.Converter) error {
	return (&service{dp: dp}).enrichAll(ctx, assets, conv)
}

// enrichAll fills every computed field on the assets in place: values, the
// base-currency conversion, invested / gain, and the 1-month change. Lots and
// history are loaded in two queries for the whole list.
func (s *service) enrichAll(ctx context.Context, assets []model.Asset, conv *fx.Converter) error {
	ids := make([]uuid.UUID, len(assets))
	for i := range assets {
		ids[i] = assets[i].ID
	}
	lotsByAsset, err := s.dp.AssetLotStore.ListLotsByAssets(ctx, ids)
	if err != nil {
		return err
	}
	cutoff := time.Now().UTC().AddDate(0, 0, -30)
	monthAgo, err := s.dp.AssetValueHistStore.LatestBefore(ctx, ids, cutoff)
	if err != nil {
		return err
	}

	for i := range assets {
		a := &assets[i]
		enrich(a)
		rate := conv.Rate(ctx, a.Currency)
		enrichWithFX(a, conv.To(), rate)

		if invested, ok := costBasis(lotsByAsset[a.ID]); ok {
			owned := round2(invested * a.OwnershipPct / 100 * rate)
			gain := round2(a.OwnedValueConverted - owned)
			a.Invested, a.Gain = &owned, &gain
			a.GainPct = fx.ChangePct(owned, a.OwnedValueConverted)
		}
		// Only for assets already in Silo 30 days ago: one added since only
		// has its purchase price from back then, and the jump from that to
		// today's value isn't a change "this month".
		if old, ok := monthAgo[a.ID]; ok && a.CreatedAt.Before(cutoff) {
			then := round2(old.Value * a.OwnershipPct / 100 * rate)
			change := round2(a.OwnedValueConverted - then)
			a.ChangeAmount1M = &change
			a.ChangePct1M = fx.ChangePct(then, a.OwnedValueConverted)
		}
	}
	return nil
}

// costBasis is what the lots cost in the asset's currency (whole asset, not
// the owned share). ok is false when no lot has a price.
func costBasis(lots []model.AssetLot) (cost float64, ok bool) {
	for _, l := range lots {
		if l.AcquisitionPrice != nil && *l.AcquisitionPrice > 0 {
			cost += l.Quantity * *l.AcquisitionPrice
			ok = true
		}
	}
	return cost, ok
}

// enrichWithFX populates the FX conversion fields on an asset.
func enrichWithFX(a *model.Asset, baseCurrency currency.Code, rate float64) {
	a.OwnedValueConverted = round2(a.OwnedValue * rate)
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

	portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, portfolioID)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch portfolio for overview")
		return model.AssetOverview{}, err
	}

	assets, err := s.dp.AssetStore.ListAssetsByPortfolio(ctx, portfolioID, model.ListAssetsFilter{})
	if err != nil {
		log.Error().Err(err).Msg("failed to list assets for overview")
		return model.AssetOverview{}, err
	}
	if err := s.enrichAll(ctx, assets, fx.New(s.dp, portfolio.BaseCurrency)); err != nil {
		return model.AssetOverview{}, err
	}

	var (
		totalValue, investable, nonInvestable float64
		investCount, nonInvCount              int
		monthAgo                              float64
	)
	for _, a := range assets {
		totalValue += a.OwnedValueConverted
		switch a.Investability {
		case model.InvestabilityCash, model.InvestabilityInvestable:
			investable += a.OwnedValueConverted
			investCount++
		case model.InvestabilityNonInvest:
			nonInvestable += a.OwnedValueConverted
			nonInvCount++
		}
		// An asset added in the last 30 days counts as unchanged, so adding
		// something isn't shown as growth.
		if a.ChangeAmount1M != nil {
			monthAgo += a.OwnedValueConverted - *a.ChangeAmount1M
		} else {
			monthAgo += a.OwnedValueConverted
		}
	}

	growth := totalValue - monthAgo
	var growthPct float64
	if monthAgo > 0 {
		growthPct = growth / monthAgo * 100
	}

	return model.AssetOverview{
		Currency:      portfolio.BaseCurrency,
		TotalAssets:   model.OverviewBucket{Value: round2(totalValue), Count: len(assets)},
		Growth30d:     model.OverviewGrowth{Amount: round2(growth), Percentage: round2(growthPct)},
		Investable:    model.OverviewBucket{Value: round2(investable), Count: investCount},
		NonInvestable: model.OverviewBucket{Value: round2(nonInvestable), Count: nonInvCount},
	}, nil
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

	if req.FolderID.Set {
		if req.FolderID.Value != nil {
			if err := s.checkFolder(ctx, *req.FolderID.Value, a.PortfolioID); err != nil {
				return model.Asset{}, err
			}
		}
		a.FolderID = req.FolderID.Value
	}
	if req.Name != nil {
		a.Name = *req.Name
	}
	if req.OwnershipPct != nil {
		a.OwnershipPct = *req.OwnershipPct
	}

	// A new price comes either as a price per unit (current_price) or as the
	// owned share's value in the base currency (owned_value), never both.
	newPrice, err := s.priceFromRequest(ctx, a, req)
	if err != nil {
		return model.Asset{}, err
	}
	priceAt, err := pastOrToday(req.PriceDate)
	if err != nil {
		return model.Asset{}, err
	}
	if req.PriceDate != nil && newPrice == nil {
		return model.Asset{}, siloErrors.ErrInvalidRequest
	}
	// A back-dated price only fills in history; current_price follows the
	// newest value.
	priceChanged := false
	if newPrice != nil && s.isNewest(ctx, a.ID, priceAt) {
		priceChanged = *newPrice != a.CurrentPrice
		a.CurrentPrice = *newPrice
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

	// Record the value whenever a price was sent with a date, or the price changed.
	if newPrice != nil && (req.PriceDate != nil || priceChanged) {
		s.recordValueAt(ctx, updated, *newPrice, priceAt)
	}

	return s.present(ctx, updated)
}

// priceFromRequest returns the new price per unit an update asks for, or nil.
func (s *service) priceFromRequest(ctx context.Context, a model.Asset, req model.UpdateAssetRequest) (*float64, error) {
	switch {
	case req.CurrentPrice != nil && req.OwnedValue != nil:
		return nil, siloErrors.ErrInvalidRequest
	case req.CurrentPrice != nil:
		return req.CurrentPrice, nil
	case req.OwnedValue != nil:
		if a.Quantity <= 0 || a.OwnershipPct <= 0 || *req.OwnedValue < 0 {
			return nil, siloErrors.ErrInvalidRequest
		}
		portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, a.PortfolioID)
		if err != nil {
			return nil, err
		}
		rate := fx.New(s.dp, portfolio.BaseCurrency).Rate(ctx, a.Currency)
		price := *req.OwnedValue / rate / (a.OwnershipPct / 100) / a.Quantity
		return &price, nil
	}
	return nil, nil
}

// isNewest reports whether a value dated at is at least as new as the asset's
// latest value-history entry (so it should become the current price).
func (s *service) isNewest(ctx context.Context, assetID uuid.UUID, at time.Time) bool {
	latest, err := s.dp.AssetValueHistStore.LatestByAsset(ctx, assetID)
	if err != nil {
		return true
	}
	return !at.Before(model.StartOfDay(latest.RecordedAt))
}

// pastOrToday is model.RecordTime with a future date refused.
func pastOrToday(d *model.DateOnly) (time.Time, error) {
	t, ok := model.RecordTime(d)
	if !ok {
		return time.Time{}, siloErrors.ErrDateInFuture
	}
	return t, nil
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
			FolderID:      &req.FolderID,
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
		FolderID:      &req.FolderID,
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
// Each entry also carries the owned share in the portfolio's base currency and
// the change from the entry before it.
func (s *service) ListValueHistory(ctx context.Context, assetID, callerID uuid.UUID, from, to time.Time) ([]model.AssetValueHistory, error) {
	a, err := s.dp.AssetStore.GetAssetByID(ctx, assetID)
	if err != nil {
		return nil, err
	}
	portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, a.PortfolioID)
	if err != nil {
		return nil, err
	}
	entries, err := s.dp.AssetValueHistStore.ListByAsset(ctx, assetID, from, to)
	if err != nil {
		return nil, err
	}

	conv := fx.New(s.dp, portfolio.BaseCurrency)
	// The entry just before the range, so the first point in it has a change too.
	prev, hasPrev := 0.0, false
	if before, err := s.dp.AssetValueHistStore.LatestByAssetBefore(ctx, assetID, from.Add(-time.Nanosecond)); err == nil {
		prev, hasPrev = round2(conv.Convert(ctx, before.Value, before.Currency)*a.OwnershipPct/100), true
	}
	for i := range entries {
		e := &entries[i]
		e.OwnedValueConverted = round2(conv.Convert(ctx, e.Value, e.Currency) * a.OwnershipPct / 100)
		e.ConvertedCurrency = conv.To()
		if hasPrev {
			change := round2(e.OwnedValueConverted - prev)
			e.ChangeAmount = &change
			e.ChangePct = fx.ChangePct(prev, e.OwnedValueConverted)
		}
		prev, hasPrev = e.OwnedValueConverted, true
	}
	return entries, nil
}

// checkFolder makes sure an asset is being put in an asset folder of its own
// portfolio.
func (s *service) checkFolder(ctx context.Context, folderID, portfolioID uuid.UUID) error {
	folder, err := s.dp.FolderStore.GetFolderByID(ctx, folderID)
	if err != nil || folder.PortfolioID != portfolioID {
		return siloErrors.ErrFolderNotFound
	}
	if folder.FolderType != model.FolderTypeAsset {
		return siloErrors.ErrFolderTypeMismatch
	}
	return nil
}

// recordValueHistory writes a value history snapshot for an asset.
// Called automatically when current_price is updated manually.
func (s *service) recordValueHistory(ctx context.Context, a model.Asset, src model.ValueHistorySource) {
	s.recordValue(ctx, a, a.CurrentPrice, time.Now().UTC(), src)
}

// recordValueAt writes a manual value-history entry for a price on a day.
func (s *service) recordValueAt(ctx context.Context, a model.Asset, price float64, at time.Time) {
	s.recordValue(ctx, a, price, at, model.SourceManual)
}

func (s *service) recordValue(ctx context.Context, a model.Asset, price float64, at time.Time, src model.ValueHistorySource) {
	entry := model.AssetValueHistory{
		AssetID:    a.ID,
		Value:      price * a.Quantity,
		Currency:   a.Currency,
		Source:     src,
		RecordedAt: at,
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
