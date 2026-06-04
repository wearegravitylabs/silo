package model

import (
	"time"

	"github.com/google/uuid"
)

// AssetLot records a single purchase tranche for an asset.
// One asset can have many lots — together they make up the full position.
type AssetLot struct {
	ID      uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	AssetID uuid.UUID `gorm:"type:uuid;not null;index" json:"asset_id"`

	// Quantity is the number of units purchased in this tranche.
	Quantity float64 `gorm:"type:numeric(28,10);not null" json:"quantity"`
	// AcquisitionPrice is the per-unit price paid. Nil when a historical fetch failed.
	AcquisitionPrice *float64 `gorm:"type:numeric(28,10)" json:"acquisition_price"`
	// AcquisitionDate is the date the user reports buying this lot.
	AcquisitionDate time.Time `gorm:"type:date;not null" json:"acquisition_date"`
	// PriceDateUsed is the actual trading day whose price was used when the
	// acquisition_date fell on a weekend or holiday.
	PriceDateUsed *time.Time `gorm:"type:date" json:"price_date_used"`

	Notes     string    `json:"notes"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateLotRequest is the payload for adding a single lot during asset creation
// or via POST /assets/:id/lots.
type CreateLotRequest struct {
	// Quantity must be positive.
	Quantity float64 `json:"quantity" binding:"required,gt=0"`
	// AcquisitionDate is when the purchase was made.
	AcquisitionDate time.Time `json:"acquisition_date" binding:"required"`
	// AcquisitionPrice is required for manual asset types.
	// For ticker-based types it is optional — fetched from provider like Yahoo Finance.
	AcquisitionPrice *float64 `json:"acquisition_price"`
	Notes            string   `json:"notes"`
}
