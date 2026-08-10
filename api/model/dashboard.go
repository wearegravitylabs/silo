package model

import (
	"time"

	"github.com/google/uuid"
)

// DashboardDataStatus describes how much historical data is available.
type DashboardDataStatus string

const (
	DashboardStatusEmpty              DashboardDataStatus = "empty"               // no assets or debts yet
	DashboardStatusInsufficientHistory DashboardDataStatus = "insufficient_history" // assets exist but no history for the period
	DashboardStatusReady              DashboardDataStatus = "ready"               // full data available
)

// DashboardResponse is the single payload returned by GET /dashboard.
type DashboardResponse struct {
	DataStatus  DashboardDataStatus `json:"data_status"`
	NetWorth    DashboardNetWorth   `json:"net_worth"`
	Chart       DashboardChart      `json:"chart"`
	Allocation  DashboardAllocation `json:"allocation"`
	TopMovers   DashboardTopMovers  `json:"top_movers"`
	Debts       []DashboardDebt     `json:"debts"`
	LastSyncedAt time.Time          `json:"last_synced_at"`
}

// DashboardNetWorth is the headline net-worth block.
type DashboardNetWorth struct {
	Total        float64  `json:"total"`
	Assets       float64  `json:"assets"`
	Debts        float64  `json:"debts"`
	Currency     string   `json:"currency"`
	// Nullable — null when data_status != "ready"
	ChangeAmount *float64 `json:"change_amount"`
	ChangePct    *float64 `json:"change_pct"`
}

// DashboardChart is the net-worth-over-time data for the chart.
type DashboardChart struct {
	Period string               `json:"period"` // W | 1M | 3M | 6M | 1Y
	Points []DashboardChartPoint `json:"points"` // empty array when no history
}

// DashboardChartPoint is a single date/value on the chart.
type DashboardChartPoint struct {
	Date  string  `json:"date"`  // YYYY-MM-DD
	Value float64 `json:"value"` // net worth on that date
}

// DashboardAllocation groups assets by class and debts by type.
type DashboardAllocation struct {
	Assets []DashboardAllocItem `json:"assets"`
	Debts  []DashboardAllocItem `json:"debts"`
}

// DashboardAllocItem is a single segment in the allocation breakdown.
type DashboardAllocItem struct {
	Label string  `json:"label"`
	Value float64 `json:"value"`
	Pct   float64 `json:"pct"`
	Count int     `json:"count,omitempty"`
}

// DashboardTopMovers holds the best and worst performing assets in the period.
type DashboardTopMovers struct {
	Gainers []DashboardMover `json:"gainers"`
	Losers  []DashboardMover `json:"losers"`
}

// DashboardMover is a single asset in the top-movers list.
type DashboardMover struct {
	AssetID      uuid.UUID `json:"asset_id"`
	Name         string    `json:"name"`
	Ticker       string    `json:"ticker,omitempty"`
	LogoURL      string    `json:"logo_url,omitempty"`
	AssetType    string    `json:"asset_type"`
	CurrentValue float64   `json:"current_value"`
	// Nullable — null when data_status != "ready"
	ChangeAmount *float64  `json:"change_amount"`
	ChangePct    *float64  `json:"change_pct"`
}

// DashboardDebt is a single debt entry in the dashboard debts list.
type DashboardDebt struct {
	DebtID      uuid.UUID `json:"debt_id"`
	Name        string    `json:"name"`
	DebtType    string    `json:"debt_type"`
	Balance     float64   `json:"balance"`
	OwnedBalance float64  `json:"owned_balance"`
	Currency    string    `json:"currency"`
	// Nullable — null when data_status != "ready"
	ChangeAmount *float64  `json:"change_amount"`
	ChangePct    *float64  `json:"change_pct"`
}
