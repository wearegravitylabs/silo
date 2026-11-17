package model

import (
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/pkg/currency"
)

// Sources of a debt balance history entry.
const (
	DebtBalanceSourceCreate = "create" // the principal on the start date, written on create
	DebtBalanceSourceManual = "manual" // a balance the user entered
)

// DebtBalanceHistory is a debt's balance at a point in time. Balance is the
// whole debt in its own currency, like Debt.Balance.
type DebtBalanceHistory struct {
	ID         uuid.UUID     `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	DebtID     uuid.UUID     `gorm:"type:uuid;not null;index"                         json:"debt_id"`
	Balance    float64       `gorm:"type:numeric(28,10);not null"                     json:"balance"`
	Currency   currency.Code `gorm:"not null;default:'USD'"                           json:"currency"`
	Source     string        `gorm:"not null;default:'manual'"                        json:"source"`
	Note       string        `json:"note,omitempty"`
	RecordedAt time.Time     `gorm:"not null"                                         json:"recorded_at"`

	// ── Computed for the API (not stored) ──
	// OwnedBalanceConverted is the owned share in the portfolio's base currency.
	OwnedBalanceConverted float64       `gorm:"-" json:"owned_balance_converted"`
	ConvertedCurrency     currency.Code `gorm:"-" json:"converted_currency"`
	// ChangeAmount / ChangePct compare with the previous entry (null on the first).
	ChangeAmount *float64 `gorm:"-" json:"change_amount"`
	ChangePct    *float64 `gorm:"-" json:"change_pct"`
}

// TableName pins the table name (GORM would pluralise it).
func (DebtBalanceHistory) TableName() string { return "debt_balance_history" }
