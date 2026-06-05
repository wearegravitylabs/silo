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
}
