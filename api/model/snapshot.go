package model

import (
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/pkg/currency"
)

// Snapshot captures the net worth of a portfolio at a point in time.
type Snapshot struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	PortfolioID uuid.UUID `gorm:"type:uuid;not null;index" json:"portfolio_id"`
	TotalAssets float64   `gorm:"type:numeric(28,10);not null" json:"total_assets"`
	TotalDebts  float64   `gorm:"type:numeric(28,10);not null" json:"total_debts"`
	NetWorth    float64   `gorm:"type:numeric(28,10);not null" json:"net_worth"`
	Currency    currency.Code `gorm:"not null;default:'USD'" json:"currency"`
	Allocation  JSONB     `gorm:"type:jsonb" json:"allocation,omitempty"` // breakdown by asset type
	SnappedAt   time.Time `gorm:"not null;index" json:"snapped_at"`
}
