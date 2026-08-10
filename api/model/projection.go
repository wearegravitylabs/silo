package model

import (
	"time"

	"github.com/google/uuid"
)

// ─── Rule type constants ──────────────────────────────────────────────────────

// ProjectionRuleType identifies what a projection rule does.
type ProjectionRuleType string

const (
	// Growth
	RulePortfolioGrowth  ProjectionRuleType = "portfolio_growth"   // all assets at X% per frequency
	RuleAssetTypeGrowth  ProjectionRuleType = "asset_type_growth"  // by asset type
	RuleAssetGrowth      ProjectionRuleType = "asset_growth"       // individual asset
	RuleAssetTargetValue ProjectionRuleType = "asset_target_value" // reach $X by year

	// Debt management
	RuleDebtInterest    ProjectionRuleType = "debt_interest"    // accrue X% interest
	RuleDebtPayment     ProjectionRuleType = "debt_payment"     // pay $X at frequency
	RuleDebtAccelerated ProjectionRuleType = "debt_accelerated" // pay X% of total debt/year
	RuleDebtFreeGoal    ProjectionRuleType = "debt_free_goal"   // debt-free within N months

	// Income streams
	RuleEmploymentIncome ProjectionRuleType = "employment_income" // salary + annual raise
	RuleAssetIncome      ProjectionRuleType = "asset_income"      // rent/dividends from asset
	RuleOneTimeIncome    ProjectionRuleType = "one_time_income"   // bonus, inheritance, etc.
	RuleFutureIncome     ProjectionRuleType = "future_income"     // pension, SS starting date

	// Spending & obligations
	RuleRegularExpense   ProjectionRuleType = "regular_expense"   // recurring costs
	RuleAssetExpense     ProjectionRuleType = "asset_expense"     // upkeep per asset
	RuleManagementFee    ProjectionRuleType = "management_fee"    // % of portfolio annually
	RulePlannedPurchase  ProjectionRuleType = "planned_purchase"  // one-time spend by date
	RuleFutureObligation ProjectionRuleType = "future_obligation" // recurring cost starting date

	// Portfolio settings
	RuleInflationRate ProjectionRuleType = "inflation_rate" // applied to all expenses
)

// ─── DB models ────────────────────────────────────────────────────────────────

// ProjectionScenario is a named set of rules for projecting future net worth.
type ProjectionScenario struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	PortfolioID uuid.UUID `gorm:"type:uuid;not null;index"                         json:"portfolio_id"`
	Name        string    `gorm:"not null"                                         json:"name"`
	Description string    `gorm:"not null;default:''"                              json:"description"`
	IsDefault   bool      `gorm:"default:false"                                    json:"is_default"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Preloaded (not stored).
	Rules []ProjectionRule `gorm:"-" json:"rules,omitempty"`
}

// ProjectionRule is a single rule within a scenario.
type ProjectionRule struct {
	ID         uuid.UUID          `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	ScenarioID uuid.UUID          `gorm:"type:uuid;not null;index"                         json:"scenario_id"`
	RuleType   ProjectionRuleType `gorm:"not null"                                         json:"rule_type"`
	IsActive   bool               `gorm:"default:true"                                     json:"is_active"`
	Config     JSONB              `gorm:"type:jsonb;not null;default:'{}'"                 json:"config"`
	CreatedAt  time.Time          `json:"created_at"`
	UpdatedAt  time.Time          `json:"updated_at"`
}

// ─── Request / response types ─────────────────────────────────────────────────

type CreateScenarioRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type UpdateScenarioRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
}

type CreateRuleRequest struct {
	RuleType ProjectionRuleType `json:"rule_type" binding:"required"`
	Config   JSONB              `json:"config"`
}

type UpdateRuleRequest struct {
	Config   JSONB `json:"config"`
	IsActive *bool `json:"is_active"`
}

// ─── Chart types ─────────────────────────────────────────────────────────────

// ChartRequest is the optional body for POST /chart.
type ChartRequest struct {
	// YearsAhead is the projection horizon. Defaults to 10 if 0; capped at 50.
	YearsAhead int `json:"years_ahead"`
}

// ChartPoint is a single data point on the projected net-worth chart.
type ChartPoint struct {
	Label    string  `json:"label"`     // "Jan 2026" (monthly) or "2031" (yearly)
	Month    int     `json:"month"`     // months from now; 0 = current state
	Year     int     `json:"year"`      // calendar year
	NetWorth float64 `json:"net_worth"`
	Assets   float64 `json:"assets"`
	Debts    float64 `json:"debts"`
}

// ChartResult is the response for POST /chart.
type ChartResult struct {
	ScenarioID  uuid.UUID    `json:"scenario_id"`
	Granularity string       `json:"granularity"`  // "monthly" | "yearly"
	YearsAhead  int          `json:"years_ahead"`
	Currency    string       `json:"currency"`
	Points      []ChartPoint `json:"points"` // includes month 0 (current state)
}

// ─── Computation output ───────────────────────────────────────────────────────

// ProjectionMilestone is the portfolio state at a single future point in time.
type ProjectionMilestone struct {
	Label    string  `json:"label"`  // "1M", "6M", "1Y", etc.
	Months   int     `json:"months"` // months from now
	Year     int     `json:"year"`   // calendar year (e.g. 2031)
	NetWorth float64 `json:"net_worth"`
	Assets   float64 `json:"assets"`
	Debts    float64 `json:"debts"`

	// Change vs the starting net worth.
	ChangeAmount float64 `json:"change_amount"` // net_worth - starting_net_worth
	ChangePct    float64 `json:"change_pct"`    // percentage change from starting

	// Cumulative income and expenses over the period (for the income/expense rows Kubera shows).
	CumulativeIncome   float64 `json:"cumulative_income"`
	CumulativeExpenses float64 `json:"cumulative_expenses"`
}

// ProjectionResult is the full output of a scenario compute run.
type ProjectionResult struct {
	ScenarioID       uuid.UUID             `json:"scenario_id"`
	ScenarioName     string                `json:"scenario_name"`
	ComputedAt       time.Time             `json:"computed_at"`
	StartingNetWorth float64               `json:"starting_net_worth"`
	StartingAssets   float64               `json:"starting_assets"`
	StartingDebts    float64               `json:"starting_debts"`
	Currency         string                `json:"currency"`
	Milestones       []ProjectionMilestone `json:"milestones"`
}
