// Package dashboard aggregates all data needed for the portfolio dashboard screen.
package dashboard

import (
	"context"
	"math"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/model"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

// Dashboard aggregates the portfolio dashboard response.
type Dashboard interface {
	Get(ctx context.Context, portfolioID, callerID uuid.UUID, period string) (model.DashboardResponse, error)
}

type service struct{ dp app.Dependency }

func New(dp app.Dependency) Dashboard { return &service{dp: dp} }

// periodDays maps period strings to the number of past days to include.
var periodDays = map[string]int{
	"W":  7,
	"1M": 30,
	"3M": 90,
	"6M": 180,
	"1Y": 365,
}

func (s *service) Get(ctx context.Context, portfolioID, callerID uuid.UUID, period string) (model.DashboardResponse, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "dashboard.Get").
		Str("portfolio_id", portfolioID.String()).
		Logger()

	days, ok := periodDays[period]
	if !ok {
		period = "1M"
		days = 30
	}

	// ── Fetch portfolio for base currency ──────────────────────────────────────
	portfolio, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, portfolioID, callerID)
	if err != nil {
		return model.DashboardResponse{}, err
	}
	currency := string(portfolio.BaseCurrency)

	// ── Parallel fetch: assets + debts ─────────────────────────────────────────
	var (
		assets []model.Asset
		debts  []model.Debt
		mu     sync.Mutex
		wg     sync.WaitGroup
		fetchErr error
	)

	wg.Add(2)
	go func() {
		defer wg.Done()
		a, err := s.dp.AssetStore.ListAssetsByPortfolio(ctx, portfolioID, model.ListAssetsFilter{})
		mu.Lock()
		defer mu.Unlock()
		if err != nil {
			fetchErr = err
			return
		}
		for i := range a {
			enrich(&a[i])
		}
		assets = a
	}()
	go func() {
		defer wg.Done()
		d, err := s.dp.DebtStore.ListDebtsByPortfolio(ctx, portfolioID, model.ListDebtsFilter{})
		mu.Lock()
		defer mu.Unlock()
		if err != nil {
			fetchErr = err
			return
		}
		for i := range d {
			enrichDebt(&d[i])
		}
		debts = d
	}()
	wg.Wait()

	if fetchErr != nil {
		return model.DashboardResponse{}, fetchErr
	}

	// ── Empty state ────────────────────────────────────────────────────────────
	if len(assets) == 0 && len(debts) == 0 {
		return model.DashboardResponse{
			DataStatus:   model.DashboardStatusEmpty,
			NetWorth:     model.DashboardNetWorth{Currency: currency},
			Chart:        model.DashboardChart{Period: period, Points: []model.DashboardChartPoint{}},
			Allocation:   model.DashboardAllocation{Assets: []model.DashboardAllocItem{}, Debts: []model.DashboardAllocItem{}},
			TopMovers:    model.DashboardTopMovers{Gainers: []model.DashboardMover{}, Losers: []model.DashboardMover{}},
			Debts:        []model.DashboardDebt{},
			LastSyncedAt: time.Now().UTC(),
		}, nil
	}

	// ── Current net worth ──────────────────────────────────────────────────────
	var totalAssets, totalDebts float64
	for _, a := range assets {
		totalAssets += a.OwnedValue
	}
	for _, d := range debts {
		totalDebts += d.OwnedBalance
	}
	totalAssets = round2(totalAssets)
	totalDebts = round2(totalDebts)
	currentNW := round2(totalAssets - totalDebts)

	// ── Value history chart ────────────────────────────────────────────────────
	now := time.Now().UTC()
	from := now.AddDate(0, 0, -days)

	// Fetch value history for all assets and sum per day.
	dailyValues := map[string]float64{} // date string → summed net worth
	for _, a := range assets {
		entries, err := s.dp.AssetValueHistStore.ListByAsset(ctx, a.ID, from, now)
		if err != nil {
			log.Warn().Err(err).Str("asset_id", a.ID.String()).Msg("failed to fetch value history")
			continue
		}
		for _, e := range entries {
			key := e.RecordedAt.Format("2006-01-02")
			dailyValues[key] += e.Value
		}
	}

	// Sort dates and build chart points.
	var chartPoints []model.DashboardChartPoint
	dates := make([]string, 0, len(dailyValues))
	for d := range dailyValues {
		dates = append(dates, d)
	}
	sort.Strings(dates)
	for _, d := range dates {
		chartPoints = append(chartPoints, model.DashboardChartPoint{
			Date:  d,
			Value: round2(dailyValues[d]),
		})
	}

	// ── Insufficient history ───────────────────────────────────────────────────
	if len(chartPoints) == 0 {
		nw := model.DashboardNetWorth{
			Total:    currentNW,
			Assets:   totalAssets,
			Debts:    totalDebts,
			Currency: currency,
		}
		return model.DashboardResponse{
			DataStatus:   model.DashboardStatusInsufficientHistory,
			NetWorth:     nw,
			Chart:        model.DashboardChart{Period: period, Points: []model.DashboardChartPoint{}},
			Allocation:   buildAllocation(assets, debts),
			TopMovers:    model.DashboardTopMovers{Gainers: []model.DashboardMover{}, Losers: []model.DashboardMover{}},
			Debts:        buildDebts(debts),
			LastSyncedAt: now,
		}, nil
	}

	// ── Change vs period start ─────────────────────────────────────────────────
	oldestNW := chartPoints[0].Value
	changeAmt := round2(currentNW - oldestNW)
	changePct := 0.0
	if oldestNW != 0 {
		changePct = round2((changeAmt / math.Abs(oldestNW)) * 100)
	}

	nw := model.DashboardNetWorth{
		Total:        currentNW,
		Assets:       totalAssets,
		Debts:        totalDebts,
		Currency:     currency,
		ChangeAmount: &changeAmt,
		ChangePct:    &changePct,
	}

	// ── Top movers ─────────────────────────────────────────────────────────────
	gainers, losers := buildTopMovers(ctx, s, assets, from, now)

	// ── Build full response ────────────────────────────────────────────────────
	return model.DashboardResponse{
		DataStatus:   model.DashboardStatusReady,
		NetWorth:     nw,
		Chart:        model.DashboardChart{Period: period, Points: chartPoints},
		Allocation:   buildAllocation(assets, debts),
		TopMovers:    model.DashboardTopMovers{Gainers: gainers, Losers: losers},
		Debts:        buildDebts(debts),
		LastSyncedAt: now,
	}, nil
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func buildAllocation(assets []model.Asset, debts []model.Debt) model.DashboardAllocation {
	// Assets grouped by asset_class.
	assetByClass := map[string]model.DashboardAllocItem{}
	var totalAssetVal float64
	for _, a := range assets {
		totalAssetVal += a.OwnedValue
		item := assetByClass[a.AssetClass]
		item.Label = a.AssetClass
		item.Value = round2(item.Value + a.OwnedValue)
		item.Count++
		assetByClass[a.AssetClass] = item
	}
	assetItems := make([]model.DashboardAllocItem, 0, len(assetByClass))
	for _, item := range assetByClass {
		if totalAssetVal > 0 {
			item.Pct = round2((item.Value / totalAssetVal) * 100)
		}
		assetItems = append(assetItems, item)
	}
	sort.Slice(assetItems, func(i, j int) bool { return assetItems[i].Value > assetItems[j].Value })

	// Debts grouped by debt_type.
	debtByType := map[string]model.DashboardAllocItem{}
	var totalDebtVal float64
	for _, d := range debts {
		totalDebtVal += d.OwnedBalance
		item := debtByType[string(d.DebtType)]
		item.Label = string(d.DebtType)
		item.Value = round2(item.Value + d.OwnedBalance)
		item.Count++
		debtByType[string(d.DebtType)] = item
	}
	debtItems := make([]model.DashboardAllocItem, 0, len(debtByType))
	for _, item := range debtByType {
		if totalDebtVal > 0 {
			item.Pct = round2((item.Value / totalDebtVal) * 100)
		}
		debtItems = append(debtItems, item)
	}
	sort.Slice(debtItems, func(i, j int) bool { return debtItems[i].Value > debtItems[j].Value })

	if assetItems == nil {
		assetItems = []model.DashboardAllocItem{}
	}
	if debtItems == nil {
		debtItems = []model.DashboardAllocItem{}
	}

	return model.DashboardAllocation{Assets: assetItems, Debts: debtItems}
}

func buildDebts(debts []model.Debt) []model.DashboardDebt {
	result := make([]model.DashboardDebt, 0, len(debts))
	for _, d := range debts {
		result = append(result, model.DashboardDebt{
			DebtID:       d.ID,
			Name:         d.Name,
			DebtType:     string(d.DebtType),
			Balance:      d.Balance,
			OwnedBalance: d.OwnedBalance,
			Currency:     string(d.Currency),
		})
	}
	return result
}

func buildTopMovers(ctx context.Context, s *service, assets []model.Asset, from, now time.Time) (gainers, losers []model.DashboardMover) {
	type mover struct {
		asset      model.Asset
		changeAmt  float64
		changePct  float64
	}

	var movers []mover
	for _, a := range assets {
		currentVal := a.OwnedValue
		// Find earliest value-history entry in the period.
		entries, err := s.dp.AssetValueHistStore.ListByAsset(ctx, a.ID, from, now)
		if err != nil || len(entries) == 0 {
			continue
		}
		oldVal := entries[0].Value * (a.OwnershipPct / 100)
		if oldVal == 0 {
			continue
		}
		changeAmt := round2(currentVal - oldVal)
		changePct := round2((changeAmt / math.Abs(oldVal)) * 100)
		movers = append(movers, mover{asset: a, changeAmt: changeAmt, changePct: changePct})
	}

	// Sort by change_pct descending for gainers, ascending for losers.
	sort.Slice(movers, func(i, j int) bool { return movers[i].changePct > movers[j].changePct })

	toMover := func(m mover) model.DashboardMover {
		return model.DashboardMover{
			AssetID:      m.asset.ID,
			Name:         m.asset.Name,
			Ticker:       m.asset.Ticker,
			LogoURL:      m.asset.LogoURL,
			AssetType:    string(m.asset.AssetType),
			CurrentValue: m.asset.OwnedValue,
			ChangeAmount: &m.changeAmt,
			ChangePct:    &m.changePct,
		}
	}

	const maxMovers = 3
	for i, m := range movers {
		if i >= maxMovers {
			break
		}
		if m.changePct > 0 {
			gainers = append(gainers, toMover(m))
		}
	}
	for i := len(movers) - 1; i >= 0; i-- {
		if len(losers) >= maxMovers {
			break
		}
		if movers[i].changePct < 0 {
			losers = append(losers, toMover(movers[i]))
		}
	}

	if gainers == nil {
		gainers = []model.DashboardMover{}
	}
	if losers == nil {
		losers = []model.DashboardMover{}
	}
	return gainers, losers
}

// enrich populates computed fields on an asset (reuses logic from asset service).
func enrich(a *model.Asset) {
	a.TotalValue = round2(a.CurrentPrice * a.Quantity)
	a.OwnedValue = round2(a.TotalValue * (a.OwnershipPct / 100.0))
}

// enrichDebt populates owned_balance on a debt.
func enrichDebt(d *model.Debt) {
	d.OwnedBalance = round2(d.Balance * (d.OwnershipPct / 100.0))
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
