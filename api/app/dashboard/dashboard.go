// Package dashboard builds the portfolio dashboard: net worth, the net-worth
// chart, allocation breakdowns, top movers and the debts summary.
package dashboard

import (
	"context"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	appAsset "github.com/wearegravitylabs/silo/api/app/asset"
	appDebt "github.com/wearegravitylabs/silo/api/app/debt"
	"github.com/wearegravitylabs/silo/api/app/fx"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

//go:generate mockgen -source dashboard.go -destination ../mock/dashboard/mock_dashboard.go -package dashboard Dashboard

// Dashboard builds the dashboard payload.
type Dashboard interface {
	// Get builds the dashboard for a chart period (1D, 1M, 3M, YTD, 1Y, ALL;
	// W and 6M also work). An unknown period is ErrInvalidPeriod.
	Get(ctx context.Context, portfolioID, callerID uuid.UUID, period string, opts ...Options) (model.DashboardResponse, error)
}

// Options are the optional dashboard settings.
type Options struct {
	// MoversWindow is the top-movers window: today, week or month (default).
	MoversWindow string
}

type service struct{ dp app.Dependency }

// New returns a Dashboard service.
func New(dp app.Dependency) Dashboard { return &service{dp: dp} }

// periodStart returns where a chart period begins. ok is false for an
// unknown period. ALL returns the zero time; the caller uses the first point
// of history instead.
func periodStart(period string, now time.Time) (time.Time, bool) {
	switch period {
	case "1D":
		return now.AddDate(0, 0, -1), true
	case "W":
		return now.AddDate(0, 0, -7), true
	case "1M":
		return now.AddDate(0, -1, 0), true
	case "3M":
		return now.AddDate(0, -3, 0), true
	case "6M":
		return now.AddDate(0, -6, 0), true
	case "YTD":
		return time.Date(now.Year(), 1, 1, 0, 0, 0, 0, time.UTC), true
	case "1Y":
		return now.AddDate(-1, 0, 0), true
	case "ALL":
		return time.Time{}, true
	}
	return time.Time{}, false
}

// moversStart returns where a top-movers window begins.
func moversStart(window string, now time.Time) (time.Time, bool) {
	switch window {
	case "today":
		return model.StartOfDay(now), true
	case "week":
		return now.AddDate(0, 0, -7), true
	case "month":
		return now.AddDate(0, -1, 0), true
	}
	return time.Time{}, false
}

func (s *service) Get(ctx context.Context, portfolioID, callerID uuid.UUID, period string, opts ...Options) (model.DashboardResponse, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "dashboard.Get").
		Str("portfolio_id", portfolioID.String()).
		Logger()

	now := time.Now().UTC()
	period = strings.ToUpper(strings.TrimSpace(period))
	if period == "" {
		period = "1M"
	}
	from, ok := periodStart(period, now)
	if !ok {
		return model.DashboardResponse{}, siloErrors.ErrInvalidPeriod
	}
	window := "month"
	if len(opts) > 0 && opts[0].MoversWindow != "" {
		window = strings.ToLower(opts[0].MoversWindow)
	}
	moversFrom, ok := moversStart(window, now)
	if !ok {
		return model.DashboardResponse{}, siloErrors.ErrInvalidPeriod
	}

	portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, portfolioID)
	if err != nil {
		return model.DashboardResponse{}, err
	}
	conv := fx.New(s.dp, portfolio.BaseCurrency)

	assets, err := s.dp.AssetStore.ListAssetsByPortfolio(ctx, portfolioID, model.ListAssetsFilter{})
	if err != nil {
		return model.DashboardResponse{}, err
	}
	if err := appAsset.EnrichAll(ctx, s.dp, assets, conv); err != nil {
		return model.DashboardResponse{}, err
	}
	debts, err := s.dp.DebtStore.ListDebtsByPortfolio(ctx, portfolioID, model.ListDebtsFilter{})
	if err != nil {
		return model.DashboardResponse{}, err
	}
	if err := appDebt.Enrich(ctx, s.dp, debts, conv); err != nil {
		return model.DashboardResponse{}, err
	}
	debtSummary, err := appDebt.Summarize(ctx, s.dp, debts, conv)
	if err != nil {
		return model.DashboardResponse{}, err
	}

	var totalAssets, totalDebts float64
	for _, a := range assets {
		totalAssets += a.OwnedValueConverted
	}
	for _, d := range debts {
		totalDebts += d.OwnedBalanceConverted
	}
	nw := model.DashboardNetWorth{
		Total:    fx.Round2(totalAssets - totalDebts),
		Assets:   fx.Round2(totalAssets),
		Debts:    fx.Round2(totalDebts),
		Currency: conv.To(),
	}

	folders, err := s.dp.FolderStore.ListFoldersByPortfolio(ctx, portfolioID, model.FolderTypeAsset)
	if err != nil {
		log.Warn().Err(err).Msg("failed to list folders for allocation")
	}

	resp := model.DashboardResponse{
		DataStatus:         model.DashboardStatusReady,
		NetWorth:           nw,
		NetWorthByCurrency: byCurrency(assets, debts),
		Chart:              model.DashboardChart{Period: period, Granularity: "daily", Points: []model.DashboardChartPoint{}},
		Allocation:         buildAllocation(assets, debts, folders),
		TopMovers:          model.DashboardTopMovers{Window: window, Gainers: []model.DashboardMover{}, Losers: []model.DashboardMover{}},
		Debts:              buildDebts(debts),
		DebtSummary:        debtSummary,
		LastSyncedAt:       now,
	}
	if len(assets) == 0 && len(debts) == 0 {
		resp.DataStatus = model.DashboardStatusEmpty
		return resp, nil
	}

	chart, err := s.netWorthSeries(ctx, conv, assets, debts, from, now)
	if err != nil {
		return model.DashboardResponse{}, err
	}
	resp.Chart.Granularity = chart.granularity
	gainers, losers, err := s.topMovers(ctx, conv, assets, moversFrom)
	if err != nil {
		return model.DashboardResponse{}, err
	}
	resp.TopMovers.Gainers, resp.TopMovers.Losers = gainers, losers

	// Ready only when something had a value before today; otherwise there is
	// no change to show yet.
	if !chart.hasPast {
		resp.DataStatus = model.DashboardStatusInsufficientHistory
		return resp, nil
	}
	resp.Chart.Points = chart.points
	change := fx.Round2(nw.Total - chart.baseline)
	resp.NetWorth.ChangeAmount = &change
	resp.NetWorth.ChangePct = fx.ChangePct(chart.baseline, nw.Total)
	return resp, nil
}

// ─── Net-worth chart ─────────────────────────────────────────────────────────

type series struct {
	points      []model.DashboardChartPoint
	granularity string
	// baseline is net worth at the first point where anything existed.
	baseline float64
	// hasPast is true when some asset or debt had a value before today.
	hasPast bool
}

// netWorthSeries rebuilds net worth day by day (or week by week) from asset
// value history and debt balance history: at the end of each day, every
// asset counts at its latest known value and every debt at its latest known
// balance (owned share, base currency). Something with no history yet on a
// day counts as 0 that day. The last point is today's live net worth.
func (s *service) netWorthSeries(ctx context.Context, conv *fx.Converter, assets []model.Asset, debts []model.Debt, from, now time.Time) (series, error) {
	assetIDs := make([]uuid.UUID, len(assets))
	ownAsset := map[uuid.UUID]float64{}
	for i, a := range assets {
		assetIDs[i] = a.ID
		ownAsset[a.ID] = a.OwnershipPct / 100
	}
	debtIDs := make([]uuid.UUID, len(debts))
	ownDebt := map[uuid.UUID]float64{}
	for i, d := range debts {
		debtIDs[i] = d.ID
		ownDebt[d.ID] = d.OwnershipPct / 100
	}

	if from.IsZero() { // ALL: from the earliest history entry.
		from = now
		for _, e := range s.firstEntries(ctx, assetIDs, debtIDs) {
			if e.Before(from) {
				from = e
			}
		}
	}
	start := model.StartOfDay(from)
	today := model.StartOfDay(now)

	assetBefore, err := s.dp.AssetValueHistStore.LatestBefore(ctx, assetIDs, start.Add(-time.Nanosecond))
	if err != nil {
		return series{}, err
	}
	assetEntries, err := s.dp.AssetValueHistStore.ListByAssets(ctx, assetIDs, start, now)
	if err != nil {
		return series{}, err
	}
	debtBefore, err := s.dp.DebtBalanceHistStore.LatestBefore(ctx, debtIDs, start.Add(-time.Nanosecond))
	if err != nil {
		return series{}, err
	}
	debtEntries, err := s.dp.DebtBalanceHistStore.ListByDebts(ctx, debtIDs, start, now)
	if err != nil {
		return series{}, err
	}

	// Current owned, converted value of each asset and debt as we walk forward.
	assetVal := map[uuid.UUID]float64{}
	for id, e := range assetBefore {
		assetVal[id] = conv.Convert(ctx, e.Value, e.Currency) * ownAsset[id]
	}
	debtVal := map[uuid.UUID]float64{}
	for id, e := range debtBefore {
		debtVal[id] = conv.Convert(ctx, e.Balance, e.Currency) * ownDebt[id]
	}
	out := series{granularity: "daily", hasPast: len(assetBefore)+len(debtBefore) > 0}

	step := 1
	if today.Sub(start) > 2*365*24*time.Hour {
		step, out.granularity = 7, "weekly"
	}

	ai, di := 0, 0
	baselineSet := false
	for day := start; !day.After(today); day = day.AddDate(0, 0, step) {
		end := day.AddDate(0, 0, step)
		if day.AddDate(0, 0, step).After(today) {
			end = today.AddDate(0, 0, 1)
		}
		for ; ai < len(assetEntries) && assetEntries[ai].RecordedAt.Before(end); ai++ {
			e := assetEntries[ai]
			assetVal[e.AssetID] = conv.Convert(ctx, e.Value, e.Currency) * ownAsset[e.AssetID]
			if e.RecordedAt.Before(today) {
				out.hasPast = true
			}
		}
		for ; di < len(debtEntries) && debtEntries[di].RecordedAt.Before(end); di++ {
			e := debtEntries[di]
			debtVal[e.DebtID] = conv.Convert(ctx, e.Balance, e.Currency) * ownDebt[e.DebtID]
			if e.RecordedAt.Before(today) {
				out.hasPast = true
			}
		}

		var net float64
		for _, v := range assetVal {
			net += v
		}
		for _, v := range debtVal {
			net -= v
		}
		date := day
		if !day.Before(today) || end.After(today) {
			// Today: use live values so the last point matches the headline,
			// and date it today (in weekly mode its week started earlier).
			date = today
			net = 0
			for _, a := range assets {
				net += a.OwnedValueConverted
			}
			for _, d := range debts {
				net -= d.OwnedBalanceConverted
			}
		}
		if !baselineSet && len(assetVal)+len(debtVal) > 0 {
			out.baseline, baselineSet = fx.Round2(net), true
		}
		out.points = append(out.points, model.DashboardChartPoint{Date: date.Format("2006-01-02"), Value: fx.Round2(net)})
	}
	return out, nil
}

// firstEntries returns when each asset's and debt's history begins.
func (s *service) firstEntries(ctx context.Context, assetIDs, debtIDs []uuid.UUID) []time.Time {
	var out []time.Time
	epoch := time.Date(1900, 1, 1, 0, 0, 0, 0, time.UTC)
	if entries, err := s.dp.AssetValueHistStore.ListByAssets(ctx, assetIDs, epoch, time.Now().UTC()); err == nil && len(entries) > 0 {
		out = append(out, entries[0].RecordedAt)
	}
	if entries, err := s.dp.DebtBalanceHistStore.ListByDebts(ctx, debtIDs, epoch, time.Now().UTC()); err == nil && len(entries) > 0 {
		out = append(out, entries[0].RecordedAt)
	}
	return out
}

// ─── Top movers ──────────────────────────────────────────────────────────────

// topMovers compares each asset's owned value (base currency) now with its
// value at the start of the window. Assets added to Silo since the window
// started are left out.
func (s *service) topMovers(ctx context.Context, conv *fx.Converter, assets []model.Asset, from time.Time) (gainers, losers []model.DashboardMover, err error) {
	ids := make([]uuid.UUID, len(assets))
	for i, a := range assets {
		ids[i] = a.ID
	}
	then, err := s.dp.AssetValueHistStore.LatestBefore(ctx, ids, from)
	if err != nil {
		return nil, nil, err
	}

	var movers []model.DashboardMover
	for _, a := range assets {
		// Assets added during the window have no real "before" to compare.
		e, ok := then[a.ID]
		if !ok || !a.CreatedAt.Before(from) {
			continue
		}
		old := conv.Convert(ctx, e.Value, e.Currency) * a.OwnershipPct / 100
		pct := fx.ChangePct(old, a.OwnedValueConverted)
		if pct == nil || *pct == 0 {
			continue
		}
		change := fx.Round2(a.OwnedValueConverted - old)
		movers = append(movers, model.DashboardMover{
			AssetID:               a.ID,
			Name:                  a.Name,
			Ticker:                a.Ticker,
			LogoURL:               a.LogoURL,
			AssetType:             string(a.AssetType),
			Currency:              a.Currency,
			CurrentValue:          a.OwnedValue,
			CurrentValueConverted: a.OwnedValueConverted,
			ChangeAmount:          &change,
			ChangePct:             pct,
		})
	}
	sort.Slice(movers, func(i, j int) bool { return *movers[i].ChangePct > *movers[j].ChangePct })

	const maxMovers = 3
	gainers, losers = []model.DashboardMover{}, []model.DashboardMover{}
	for _, m := range movers {
		if len(gainers) < maxMovers && *m.ChangePct > 0 {
			gainers = append(gainers, m)
		}
	}
	for i := len(movers) - 1; i >= 0 && len(losers) < maxMovers; i-- {
		if *movers[i].ChangePct < 0 {
			losers = append(losers, movers[i])
		}
	}
	return gainers, losers, nil
}

// ─── Breakdowns ──────────────────────────────────────────────────────────────

// byCurrency splits net worth by holding currency, largest assets first.
func byCurrency(assets []model.Asset, debts []model.Debt) []model.DashboardCurrencyItem {
	items := map[string]*model.DashboardCurrencyItem{}
	get := func(code string) *model.DashboardCurrencyItem {
		if items[code] == nil {
			items[code] = &model.DashboardCurrencyItem{Currency: code}
		}
		return items[code]
	}
	var totalAssets float64
	for _, a := range assets {
		it := get(a.Currency)
		it.Assets += a.OwnedValue
		it.AssetsConverted += a.OwnedValueConverted
		totalAssets += a.OwnedValueConverted
	}
	for _, d := range debts {
		it := get(d.Currency)
		it.Debts += d.OwnedBalance
		it.DebtsConverted += d.OwnedBalanceConverted
	}

	out := make([]model.DashboardCurrencyItem, 0, len(items))
	for _, it := range items {
		it.Net = fx.Round2(it.Assets - it.Debts)
		it.NetConverted = fx.Round2(it.AssetsConverted - it.DebtsConverted)
		it.Assets, it.Debts = fx.Round2(it.Assets), fx.Round2(it.Debts)
		it.AssetsConverted, it.DebtsConverted = fx.Round2(it.AssetsConverted), fx.Round2(it.DebtsConverted)
		if totalAssets > 0 {
			it.Pct = fx.Round2(it.AssetsConverted / totalAssets * 100)
		}
		out = append(out, *it)
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].AssetsConverted != out[j].AssetsConverted {
			return out[i].AssetsConverted > out[j].AssetsConverted
		}
		return out[i].Currency < out[j].Currency
	})
	return out
}

func buildAllocation(assets []model.Asset, debts []model.Debt, folders []model.Folder) model.DashboardAllocation {
	folderName := map[string]string{"": "No folder"}
	for _, f := range folders {
		folderName[f.ID.String()] = f.Name
	}

	var byClass, byType, byCurrency, byFolder allocGroup
	for _, a := range assets {
		folderKey := ""
		if a.FolderID != nil {
			folderKey = a.FolderID.String()
		}
		byClass.add(a.AssetClass, a.AssetClass, a.OwnedValueConverted)
		byType.add(string(a.AssetType), string(a.AssetType), a.OwnedValueConverted)
		byCurrency.add(a.Currency, a.Currency, a.OwnedValueConverted)
		byFolder.add(folderKey, folderName[folderKey], a.OwnedValueConverted)
	}
	var byDebtType allocGroup
	for _, d := range debts {
		byDebtType.add(string(d.DebtType), string(d.DebtType), d.OwnedBalanceConverted)
	}
	return model.DashboardAllocation{
		Assets:     byClass.items(),
		Debts:      byDebtType.items(),
		ByType:     byType.items(),
		ByCurrency: byCurrency.items(),
		ByFolder:   byFolder.items(),
	}
}

// allocGroup adds values up by key and turns them into allocation items.
type allocGroup struct {
	order []string
	byKey map[string]*model.DashboardAllocItem
	total float64
}

func (g *allocGroup) add(key, label string, value float64) {
	if g.byKey == nil {
		g.byKey = map[string]*model.DashboardAllocItem{}
	}
	it, ok := g.byKey[key]
	if !ok {
		it = &model.DashboardAllocItem{Key: key, Label: label}
		g.byKey[key] = it
		g.order = append(g.order, key)
	}
	it.Value += value
	it.Count++
	g.total += value
}

func (g *allocGroup) items() []model.DashboardAllocItem {
	out := make([]model.DashboardAllocItem, 0, len(g.order))
	for _, k := range g.order {
		it := *g.byKey[k]
		it.Value = fx.Round2(it.Value)
		if g.total > 0 {
			it.Pct = fx.Round2(it.Value / g.total * 100)
		}
		out = append(out, it)
	}
	sort.SliceStable(out, func(i, j int) bool { return out[i].Value > out[j].Value })
	return out
}

func buildDebts(debts []model.Debt) []model.DashboardDebt {
	result := make([]model.DashboardDebt, 0, len(debts))
	for _, d := range debts {
		result = append(result, model.DashboardDebt{
			DebtID:                d.ID,
			Name:                  d.Name,
			DebtType:              string(d.DebtType),
			Balance:               d.Balance,
			OwnedBalance:          fx.Round2(d.OwnedBalance),
			Currency:              d.Currency,
			OwnedBalanceConverted: d.OwnedBalanceConverted,
			HasSchedule:           d.HasSchedule,
			MonthlyPayment:        d.MonthlyPayment,
			InterestRate:          d.InterestRate,
			ChangeAmount:          d.ChangeAmount1M,
			ChangePct:             d.ChangePct1M,
		})
	}
	return result
}
