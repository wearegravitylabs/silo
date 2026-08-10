package model

import (
	"time"

	"github.com/google/uuid"
)

// AssetNote is a free-text note attached to an asset or a debt.
// The same table backs notes for both entity types — exactly one of
// AssetID / DebtID will be set on any given row.
type AssetNote struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	AssetID     *uuid.UUID `gorm:"type:uuid;index"                                   json:"asset_id,omitempty"`
	DebtID      *uuid.UUID `gorm:"type:uuid;index"                                   json:"debt_id,omitempty"`
	PortfolioID uuid.UUID  `gorm:"type:uuid;not null;index"                          json:"portfolio_id"`
	Title       string     `gorm:"not null;default:''"                               json:"title"`
	Content     string     `gorm:"not null"                                          json:"content"`
	Tags        JSONB      `gorm:"type:jsonb"                                        json:"tags,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index"                                             json:"-"`
}

// CreateNoteRequest is the body accepted by the add-note endpoints.
type CreateNoteRequest struct {
	Title   string `json:"title"`
	Content string `json:"content" binding:"required"`
	Tags    JSONB  `json:"tags"`
}

// UpdateNoteRequest is the body accepted by the edit-note endpoints.
// All fields are optional — only non-nil values are applied.
type UpdateNoteRequest struct {
	Title   *string `json:"title"`
	Content *string `json:"content"`
	Tags    JSONB   `json:"tags"`
}
