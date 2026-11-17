package model

import (
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/pkg/currency"
)

// ValueHistorySource identifies what triggered a value history entry.
type ValueHistorySource string

const (
	SourceManual ValueHistorySource = "manual" // user updated current_price
	SourceTicker ValueHistorySource = "ticker" // auto-fetched from market provider
	SourceCron   ValueHistorySource = "cron"   // daily batch job
)

// AssetValueHistory records the estimated value of an asset at a point in time.
// Used to draw per-asset value charts and calculate performance over periods.
type AssetValueHistory struct {
	ID         uuid.UUID          `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	AssetID    uuid.UUID          `gorm:"type:uuid;not null;index"                         json:"asset_id"`
	Value      float64            `gorm:"type:numeric(28,10);not null"                     json:"value"`
	Currency   currency.Code      `gorm:"not null;default:'USD'"                           json:"currency"`
	Source     ValueHistorySource `gorm:"not null;default:'manual'"                        json:"source"`
	RecordedAt time.Time          `gorm:"not null"                                         json:"recorded_at"`

	// ── Computed for the API (not stored) ──
	// OwnedValueConverted is the owned share in the portfolio's base currency.
	OwnedValueConverted float64       `gorm:"-" json:"owned_value_converted"`
	ConvertedCurrency   currency.Code `gorm:"-" json:"converted_currency"`
	// ChangeAmount / ChangePct compare with the previous entry (null on the first).
	ChangeAmount *float64 `gorm:"-" json:"change_amount"`
	ChangePct    *float64 `gorm:"-" json:"change_pct"`
}

// TableName pins the table name; GORM would otherwise look for
// "asset_value_histories", which does not exist.
func (AssetValueHistory) TableName() string { return "asset_value_history" }
