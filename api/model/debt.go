package model

import (
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/pkg/currency"
)

// DebtType categorises a liability.
type DebtType string

const (
	DebtTypeMortgage    DebtType = "mortgage"
	DebtTypeStudentLoan DebtType = "student_loan"
	DebtTypeCarLoan     DebtType = "car_loan"
	DebtTypePersonal    DebtType = "personal"
	DebtTypeCreditCard  DebtType = "credit_card"
	DebtTypeManual      DebtType = "manual"
)

// PaymentFrequency defines how often a debt payment occurs.
type PaymentFrequency string

const (
	FrequencyDaily     PaymentFrequency = "daily"
	FrequencyWeekly    PaymentFrequency = "weekly"
	FrequencyBiweekly  PaymentFrequency = "biweekly"
	FrequencyMonthly   PaymentFrequency = "monthly"
	FrequencyQuarterly PaymentFrequency = "quarterly"
	FrequencyBiannual  PaymentFrequency = "biannual" // every 6 months
	FrequencyAnnually  PaymentFrequency = "annually"
)

// Debt represents a liability in a portfolio.
type Debt struct {
	ID            uuid.UUID        `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	PortfolioID   uuid.UUID        `gorm:"type:uuid;not null;index"                         json:"portfolio_id"`
	FolderID      *uuid.UUID       `gorm:"type:uuid;index"                                  json:"folder_id,omitempty"`
	Name          string           `gorm:"not null"                                         json:"name"`
	DebtType      DebtType         `gorm:"not null"                                         json:"debt_type"`
	Principal     float64          `gorm:"type:numeric(28,10);not null"                     json:"principal"`
	Balance       float64          `gorm:"type:numeric(28,10);not null"                     json:"balance"`
	InterestRate  float64          `gorm:"type:numeric(8,4)"                                json:"interest_rate"`
	PaymentAmount float64          `gorm:"type:numeric(28,10)"                              json:"payment_amount"`
	Frequency     PaymentFrequency `json:"frequency"`
	HasSchedule   bool             `gorm:"default:false"                                    json:"has_schedule"`
	Currency      currency.Code    `gorm:"not null;default:'USD'"                           json:"currency"`
	OwnershipPct  float64          `gorm:"type:numeric(8,4);default:100"                    json:"ownership_pct"`
	StartDate     *time.Time       `json:"start_date,omitempty"`
	PayoffDate    *time.Time       `json:"payoff_date,omitempty"`
	// Icon is what the app shows for the debt: an emoji, an icon name or an image URL.
	Icon      *string    `json:"icon"`
	Metadata  JSONB      `gorm:"type:jsonb"                                       json:"metadata,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `gorm:"index"                                            json:"-"`

	// ── Computed fields (not stored) ──
	// OwnedBalance is balance × (ownership_pct / 100), in the debt's currency.
	OwnedBalance float64 `gorm:"-" json:"owned_balance"`
	// OwnedBalanceConverted is OwnedBalance in the portfolio's base currency.
	OwnedBalanceConverted float64       `gorm:"-" json:"owned_balance_converted"`
	ConvertedCurrency     currency.Code `gorm:"-" json:"converted_currency"`
	// ExchangeRate: 1 unit of currency = ExchangeRate units of ConvertedCurrency.
	ExchangeRate float64 `gorm:"-" json:"exchange_rate"`
	// MonthlyPayment is payment_amount turned into a monthly figure (owned
	// share, base currency). 0 for debts without a schedule.
	MonthlyPayment float64 `gorm:"-" json:"monthly_payment"`
	// ChangeAmount1M / ChangePct1M compare the owned balance (base currency)
	// with 30 days ago. Null for a debt added to Silo in the last 30 days.
	ChangeAmount1M *float64 `gorm:"-" json:"change_amount_1m"`
	ChangePct1M    *float64 `gorm:"-" json:"change_pct_1m"`
}

// DebtSummary is the debts overview: totals across a portfolio's debts, as
// owned shares in the portfolio's base currency.
type DebtSummary struct {
	Currency currency.Code `json:"currency"`
	Count    int           `json:"count"`
	Total    float64       `json:"total"`
	// ChangeAmount1M / ChangePct1M compare Total with 30 days ago.
	ChangeAmount1M *float64 `json:"change_amount_1m"`
	ChangePct1M    *float64 `json:"change_pct_1m"`
	// ScheduledTotal is debts with a payment schedule (has_schedule);
	// UnscheduledTotal is the rest.
	ScheduledTotal   float64 `json:"scheduled_total"`
	UnscheduledTotal float64 `json:"unscheduled_total"`
	// MonthlyPayments adds up every scheduled debt's payment as a monthly figure.
	MonthlyPayments float64 `json:"monthly_payments"`
	// InterestPaidYTD estimates the interest paid since 1 January on scheduled
	// debts, from their balance history and interest rate.
	InterestPaidYTD float64 `json:"interest_paid_ytd"`
	// DebtFreeDate is when the last scheduled debt is paid off at its current
	// payment, as YYYY-MM-DD. Null when there are no scheduled debts or one of
	// them never gets paid off (payment not above the interest).
	DebtFreeDate *string `json:"debt_free_date"`
}

// CreateDebtRequest is the input for adding a debt.
type CreateDebtRequest struct {
	FolderID      *uuid.UUID       `json:"folder_id"`
	Name          string           `json:"name" binding:"required"`
	DebtType      DebtType         `json:"debt_type" binding:"required"`
	Principal     float64          `json:"principal" binding:"required,gt=0"`
	Balance       float64          `json:"balance" binding:"required,gt=0"`
	InterestRate  float64          `json:"interest_rate"`
	PaymentAmount float64          `json:"payment_amount"`
	Frequency     PaymentFrequency `json:"frequency"`
	HasSchedule   bool             `json:"has_schedule"`
	Currency      currency.Code    `json:"currency"`
	OwnershipPct  float64          `json:"ownership_pct"`
	StartDate     *time.Time       `json:"start_date"`
	Icon          *string          `json:"icon"`
	Metadata      JSONB            `json:"metadata"`
}

// UpdateDebtRequest is the input for modifying a debt.
// All fields are optional — only non-nil values are applied.
type UpdateDebtRequest struct {
	// FolderID moves the debt to another folder; null takes it out of its folder.
	FolderID      Optional[uuid.UUID] `json:"folder_id"`
	Name          *string             `json:"name"`
	Balance       *float64            `json:"balance"`
	InterestRate  *float64            `json:"interest_rate"`
	PaymentAmount *float64            `json:"payment_amount"`
	Frequency     *PaymentFrequency   `json:"frequency"`
	HasSchedule   *bool               `json:"has_schedule"`
	OwnershipPct  *float64            `json:"ownership_pct"`
	StartDate     *time.Time          `json:"start_date"`
	// Icon is cleared by sending null.
	Icon     Optional[string] `json:"icon"`
	Metadata JSONB            `json:"metadata"`

	// OwnedBalance sets the balance from the user's own share in the
	// portfolio's base currency (what the user types). The API works out the
	// whole debt's balance from it. Don't send it together with balance.
	OwnedBalance *float64 `json:"owned_balance"`
	// BalanceDate is the day a new balance applies (YYYY-MM-DD, default today).
	// A date before the latest known balance only adds it to the history.
	BalanceDate *DateOnly `json:"balance_date"`
	// BalanceNote is saved with the balance history entry, e.g. "Repayment".
	BalanceNote string `json:"balance_note"`
}

// ListDebtsFilter carries optional filter and sort criteria for GET /debts.
type ListDebtsFilter struct {
	// Search performs a case-insensitive partial match on debt name.
	Search string `form:"search"`
	// DebtType filters by a specific debt category.
	DebtType DebtType `form:"debt_type"`
	// FolderID filters debts that belong to a specific folder.
	// Bound manually in the handler (form:"-") because Gin's query binder
	// cannot unmarshal a *uuid.UUID from a query string.
	FolderID *uuid.UUID `form:"-"`
	// Sort is the field to sort by: balance, name, created_at. Defaults to created_at.
	Sort string `form:"sort"`
	// Order is the sort direction: asc or desc. Defaults to asc.
	Order string `form:"order"`
}
