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
	RuleInflationRate ProjectionRuleType = "inflation_rate" // applied to expenses only

	// Category growth: one of investable_assets, stocks, non_investable_assets
	// or debts changes by X% a year. The default scenario is made of these.
	RuleValueChange ProjectionRuleType = "value_change"
)

// DefaultScenarioRules are the rules of "Scenario A", which every new
// portfolio starts with. The 20261117000022 migration gave existing
// portfolios the same.
func DefaultScenarioRules() []ProjectionRule {
	change := func(target string, pct float64) ProjectionRule {
		return ProjectionRule{RuleType: RuleValueChange, IsActive: true, Config: JSONB{"target": target, "percentage": pct}}
	}
	return []ProjectionRule{
		change("investable_assets", 7),
		{RuleType: RuleInflationRate, IsActive: true, Config: JSONB{"percentage": 8.0}},
		change("stocks", 5),
		change("debts", -2),
		change("non_investable_assets", 7),
	}
}

// Default scenario name and colour (the app's first swatch).
const (
	DefaultScenarioName  = "Scenario A"
	DefaultScenarioColor = "var(--color-primary-dark)"
)

// ─── DB models ────────────────────────────────────────────────────────────────

// ProjectionScenario is a named set of rules for projecting future net worth.
type ProjectionScenario struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	PortfolioID uuid.UUID `gorm:"type:uuid;not null;index"                         json:"portfolio_id"`
	Name        string    `gorm:"not null"                                         json:"name"`
	Description string    `gorm:"not null;default:''"                              json:"description"`
	// Color is the scenario's line colour in the app (any CSS colour).
	Color     string    `gorm:"not null;default:''"                                json:"color"`
	IsDefault bool      `gorm:"default:false"                                      json:"is_default"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

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
	Color       string `json:"color"`
}

type UpdateScenarioRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Color       *string `json:"color"`
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

// ChartPoint is one month on the projected chart.
type ChartPoint struct {
	Label    string  `json:"label"` // "Jan 2026"
	Date     string  `json:"date"`  // first of the month, YYYY-MM-DD
	Month    int     `json:"month"` // months from now; 0 = today
	Year     int     `json:"year"`  // calendar year
	NetWorth float64 `json:"net_worth"`
	Assets   float64 `json:"assets"`
	Debts    float64 `json:"debts"`
	// Cash is the money income and expenses have added up to since today
	// (starts at 0, can go below 0). NetWorthWithCash is NetWorth + Cash.
	Cash             float64 `json:"cash"`
	NetWorthWithCash float64 `json:"net_worth_with_cash"`
}

// ChartResult is the response for POST /chart.
type ChartResult struct {
	ScenarioID  uuid.UUID    `json:"scenario_id"`
	Granularity string       `json:"granularity"` // always "monthly"
	YearsAhead  int          `json:"years_ahead"`
	Currency    string       `json:"currency"`
	Points      []ChartPoint `json:"points"` // month 0 (today) to years_ahead × 12
	// Change from today to the last point, for the page header.
	ChangeAmount         float64  `json:"change_amount"`
	ChangePct            *float64 `json:"change_pct"`
	ChangeAmountWithCash float64  `json:"change_amount_with_cash"`
	ChangePctWithCash    *float64 `json:"change_pct_with_cash"`
	// Warnings name what the projection had to skip, e.g.
	// "date_of_birth_missing" when an "until age" rule has no date of birth.
	Warnings []string `json:"warnings"`
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
	// Cash and NetWorthWithCash: see ChartPoint.
	Cash             float64 `json:"cash"`
	NetWorthWithCash float64 `json:"net_worth_with_cash"`

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
	// Warnings: see ChartResult.
	Warnings []string `json:"warnings"`
}
