package model

import (
	"time"

	"github.com/google/uuid"
)

// DashboardDataStatus describes how much historical data is available.
type DashboardDataStatus string

const (
	DashboardStatusEmpty               DashboardDataStatus = "empty"                // no assets or debts yet
	DashboardStatusInsufficientHistory DashboardDataStatus = "insufficient_history" // assets exist but no history for the period
	DashboardStatusReady               DashboardDataStatus = "ready"                // full data available
)

// DashboardResponse is the single payload returned by GET /dashboard.
//
// Every amount is the owned share converted to the portfolio's base currency
// (net_worth.currency), unless a field says it is in the item's own currency.
type DashboardResponse struct {
	DataStatus DashboardDataStatus `json:"data_status"`
	NetWorth   DashboardNetWorth   `json:"net_worth"`
	// NetWorthByCurrency splits net worth by the currency things are held in,
	// largest first.
	NetWorthByCurrency []DashboardCurrencyItem `json:"net_worth_by_currency"`
	Chart              DashboardChart          `json:"chart"`
	Allocation         DashboardAllocation     `json:"allocation"`
	TopMovers          DashboardTopMovers      `json:"top_movers"`
	Debts              []DashboardDebt         `json:"debts"`
	DebtSummary        DebtSummary             `json:"debt_summary"`
	LastSyncedAt       time.Time               `json:"last_synced_at"`
}

// DashboardNetWorth is the headline net-worth block.
type DashboardNetWorth struct {
	Total    float64 `json:"total"`
	Assets   float64 `json:"assets"`
	Debts    float64 `json:"debts"`
	Currency string  `json:"currency"`
	// Change since the start of the chart period. Null when data_status != "ready".
	ChangeAmount *float64 `json:"change_amount"`
	ChangePct    *float64 `json:"change_pct"`
}

// DashboardCurrencyItem is one currency in the net-worth-by-currency strip.
type DashboardCurrencyItem struct {
	Currency string `json:"currency"`
	// Assets, Debts and Net are in this currency (owned shares).
	Assets float64 `json:"assets"`
	Debts  float64 `json:"debts"`
	Net    float64 `json:"net"`
	// The same three in the portfolio's base currency.
	AssetsConverted float64 `json:"assets_converted"`
	DebtsConverted  float64 `json:"debts_converted"`
	NetConverted    float64 `json:"net_converted"`
	// Pct is this currency's share of total assets (base currency).
	Pct float64 `json:"pct"`
}

// DashboardChart is the net-worth-over-time data for the chart.
type DashboardChart struct {
	Period string `json:"period"` // 1D | 1M | 3M | YTD | 1Y | ALL (W and 6M also accepted)
	// Granularity is "daily", or "weekly" when the period spans over two years.
	Granularity string                `json:"granularity"`
	Points      []DashboardChartPoint `json:"points"` // empty array when no history
}

// DashboardChartPoint is a single date/value on the chart.
type DashboardChartPoint struct {
	Date  string  `json:"date"`  // YYYY-MM-DD
	Value float64 `json:"value"` // net worth at the end of that day (assets − debts)
}

// DashboardAllocation breaks down assets and debts several ways.
type DashboardAllocation struct {
	// Assets is grouped by asset class (stock, real_estate, …).
	Assets []DashboardAllocItem `json:"assets"`
	// Debts is grouped by debt type (mortgage, car_loan, …).
	Debts []DashboardAllocItem `json:"debts"`
	// ByType groups assets by asset_type (stock_ticker, real_estate, …).
	ByType []DashboardAllocItem `json:"by_type"`
	// ByCurrency groups assets by the currency they are held in.
	ByCurrency []DashboardAllocItem `json:"by_currency"`
	// ByFolder groups assets by folder. key is the folder id ("" for assets
	// outside any folder) and label the folder name.
	ByFolder []DashboardAllocItem `json:"by_folder"`
}

// DashboardAllocItem is a single segment in an allocation breakdown.
type DashboardAllocItem struct {
	// Key is the machine value grouped on (class, type, currency or folder id).
	Key   string  `json:"key"`
	Label string  `json:"label"`
	Value float64 `json:"value"`
	Pct   float64 `json:"pct"`
	Count int     `json:"count,omitempty"`
}

// DashboardTopMovers holds the best and worst performing assets in the window.
type DashboardTopMovers struct {
	Window  string           `json:"window"` // today | week | month
	Gainers []DashboardMover `json:"gainers"`
	Losers  []DashboardMover `json:"losers"`
}

// DashboardMover is a single asset in the top-movers list.
type DashboardMover struct {
	AssetID   uuid.UUID `json:"asset_id"`
	Name      string    `json:"name"`
	Ticker    string    `json:"ticker,omitempty"`
	LogoURL   string    `json:"logo_url,omitempty"`
	AssetType string    `json:"asset_type"`
	// Currency is the asset's own currency; CurrentValue is in it.
	Currency     string  `json:"currency"`
	CurrentValue float64 `json:"current_value"`
	// CurrentValueConverted and ChangeAmount are in the base currency.
	CurrentValueConverted float64  `json:"current_value_converted"`
	ChangeAmount          *float64 `json:"change_amount"`
	ChangePct             *float64 `json:"change_pct"`
}

// DashboardDebt is a single debt entry in the dashboard debts list.
type DashboardDebt struct {
	DebtID   uuid.UUID `json:"debt_id"`
	Name     string    `json:"name"`
	DebtType string    `json:"debt_type"`
	// Balance and OwnedBalance are in Currency, the debt's own currency.
	Balance      float64 `json:"balance"`
	OwnedBalance float64 `json:"owned_balance"`
	Currency     string  `json:"currency"`
	// OwnedBalanceConverted and MonthlyPayment are in the base currency.
	OwnedBalanceConverted float64 `json:"owned_balance_converted"`
	HasSchedule           bool    `json:"has_schedule"`
	MonthlyPayment        float64 `json:"monthly_payment"`
	InterestRate          float64 `json:"interest_rate"`
	// Change of the owned balance (base currency) over the last 30 days.
	ChangeAmount *float64 `json:"change_amount"`
	ChangePct    *float64 `json:"change_pct"`
}
