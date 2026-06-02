package model

import (
	"time"

	"github.com/google/uuid"
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
	FrequencyAnnually  PaymentFrequency = "annually"
)

// Debt represents a liability in a portfolio.
type Debt struct {
	ID              uuid.UUID        `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	PortfolioID     uuid.UUID        `gorm:"type:uuid;not null;index" json:"portfolio_id"`
	Name            string           `gorm:"not null" json:"name"`
	DebtType        DebtType         `gorm:"not null" json:"debt_type"`
	Principal       float64          `gorm:"type:numeric(28,10);not null" json:"principal"`
	Balance         float64          `gorm:"type:numeric(28,10);not null" json:"balance"`
	InterestRate    float64          `gorm:"type:numeric(8,4)" json:"interest_rate"`
	PaymentAmount   float64          `gorm:"type:numeric(28,10)" json:"payment_amount"`
	Frequency       PaymentFrequency `json:"frequency"`
	HasSchedule     bool             `gorm:"default:false" json:"has_schedule"`
	Currency        string           `gorm:"not null;default:'USD'" json:"currency"`
	OwnershipPct    float64          `gorm:"type:numeric(6,4);default:100" json:"ownership_pct"`
	StartDate       *time.Time       `json:"start_date"`
	PayoffDate      *time.Time       `json:"payoff_date"`
	Metadata        JSONB            `gorm:"type:jsonb" json:"metadata,omitempty"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
	DeletedAt       *time.Time       `gorm:"index" json:"-"`
}

// CreateDebtRequest is the input for adding a debt.
type CreateDebtRequest struct {
	Name          string           `json:"name" binding:"required"`
	DebtType      DebtType         `json:"debt_type" binding:"required"`
	Principal     float64          `json:"principal" binding:"required,gt=0"`
	Balance       float64          `json:"balance" binding:"required,gt=0"`
	InterestRate  float64          `json:"interest_rate"`
	PaymentAmount float64          `json:"payment_amount"`
	Frequency     PaymentFrequency `json:"frequency"`
	HasSchedule   bool             `json:"has_schedule"`
	Currency      string           `json:"currency"`
	OwnershipPct  float64          `json:"ownership_pct"`
	StartDate     *time.Time       `json:"start_date"`
}

// UpdateDebtRequest is the input for modifying a debt.
type UpdateDebtRequest struct {
	Name          *string          `json:"name"`
	Balance       *float64         `json:"balance"`
	InterestRate  *float64         `json:"interest_rate"`
	PaymentAmount *float64         `json:"payment_amount"`
	Frequency     *PaymentFrequency `json:"frequency"`
}
