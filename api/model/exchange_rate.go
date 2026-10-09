package model

import (
	"time"

	"github.com/google/uuid"
)

// ExchangeRate is a cached FX rate: 1 unit of BaseCurrency = Rate units of Currency.
// Refreshed daily by the fx-rate-refresh scheduled job (see app/exchangerate).
// Only the latest rate per (base_currency, currency) pair is kept — this is a
// cache, not a rate-history table.
type ExchangeRate struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	BaseCurrency string    `gorm:"not null" json:"base_currency"`
	Currency     string    `gorm:"not null" json:"currency"`
	Rate         float64   `gorm:"type:numeric(28,10);not null" json:"rate"`
	FetchedAt    time.Time `json:"fetched_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
