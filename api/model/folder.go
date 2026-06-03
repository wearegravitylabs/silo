package model

import (
	"time"

	"github.com/google/uuid"
)

// Folder is an organisational group for assets within a portfolio.
// Folders are ordered by position (ascending) for display.
type Folder struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	PortfolioID uuid.UUID `gorm:"type:uuid;not null;index"                         json:"portfolio_id"`
	Name        string    `gorm:"not null"                                         json:"name"`
	Icon        *string   `json:"icon"`      // emoji or short identifier, e.g. "📈"
	ImageURL    *string   `json:"image_url"` // user-uploaded cover image
	Position    int       `gorm:"not null;default:0"                               json:"position"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CreateFolderRequest is the payload for POST /portfolios/:id/folders.
type CreateFolderRequest struct {
	Name     string  `json:"name"      binding:"required,min=1,max=255"`
	Icon     *string `json:"icon"`
	ImageURL *string `json:"image_url"`
}

// UpdateFolderRequest is the payload for PATCH /portfolios/:id/folders/:fid.
// All fields are optional.
type UpdateFolderRequest struct {
	Name     *string `json:"name"      binding:"omitempty,min=1,max=255"`
	Icon     *string `json:"icon"`
	ImageURL *string `json:"image_url"`
}

// FolderPosition is a single {id, position} pair used in a reorder request.
type FolderPosition struct {
	ID       uuid.UUID `json:"id"       binding:"required"`
	Position int       `json:"position" binding:"min=0"`
}

// ReorderFoldersRequest is the payload for PUT /portfolios/:id/folders/reorder.
// Send the complete new ordering — every folder in the portfolio should appear.
type ReorderFoldersRequest struct {
	Folders []FolderPosition `json:"folders" binding:"required,min=1"`
}
