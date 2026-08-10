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
	Metadata      JSONB            `gorm:"type:jsonb"                                       json:"metadata,omitempty"`
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`
	DeletedAt     *time.Time       `gorm:"index"                                            json:"-"`

	// OwnedBalance is balance × (ownership_pct / 100). Computed, not stored.
	OwnedBalance float64 `gorm:"-" json:"owned_balance"`
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
}

// UpdateDebtRequest is the input for modifying a debt.
// All fields are optional — only non-nil values are applied.
type UpdateDebtRequest struct {
	FolderID      *uuid.UUID        `json:"folder_id"`
	Name          *string           `json:"name"`
	Balance       *float64          `json:"balance"`
	InterestRate  *float64          `json:"interest_rate"`
	PaymentAmount *float64          `json:"payment_amount"`
	Frequency     *PaymentFrequency `json:"frequency"`
	HasSchedule   *bool             `json:"has_schedule"`
	OwnershipPct  *float64          `json:"ownership_pct"`
	StartDate     *time.Time        `json:"start_date"`
}

// ListDebtsFilter carries optional filter and sort criteria for GET /debts.
type ListDebtsFilter struct {
	// Search performs a case-insensitive partial match on debt name.
	Search string `form:"search"`
	// DebtType filters by a specific debt category.
	DebtType DebtType `form:"debt_type"`
	// FolderID filters debts that belong to a specific folder.
	FolderID *uuid.UUID `form:"folder_id"`
	// Sort is the field to sort by: balance, name, created_at. Defaults to created_at.
	Sort string `form:"sort"`
	// Order is the sort direction: asc or desc. Defaults to asc.
	Order string `form:"order"`
}
