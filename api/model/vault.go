package model

import (
	"time"

	"github.com/google/uuid"
)

// VaultDocument is a client-side-encrypted file stored in the Vault.
// The server only sees ciphertext blobs — plaintext never leaves the client.
type VaultDocument struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	PortfolioID uuid.UUID  `gorm:"type:uuid;not null;index" json:"portfolio_id"`
	FileName    string     `gorm:"not null" json:"file_name"`
	FileType    string     `gorm:"not null" json:"file_type"`
	StoragePath string     `gorm:"not null" json:"-"` // path in object storage
	FileSize    int64      `json:"file_size"`
	Tags        JSONB      `gorm:"type:jsonb" json:"tags,omitempty"`
	UploadedAt  time.Time  `json:"uploaded_at"`
	DeletedAt   *time.Time `gorm:"index" json:"-"`
}

// AssetDocument is a file attached to an asset.
// Files are stored in the private bucket and accessed exclusively via presigned URLs.
type AssetDocument struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	AssetID     *uuid.UUID `gorm:"type:uuid;index" json:"asset_id"`
	DebtID      *uuid.UUID `gorm:"type:uuid;index" json:"debt_id"`
	PortfolioID uuid.UUID  `gorm:"type:uuid;not null;index" json:"portfolio_id"`
	FileName    string     `gorm:"not null" json:"file_name"`
	FileType    string     `gorm:"not null" json:"file_type"`
	StoragePath string     `gorm:"not null" json:"-"` // key in the private bucket — never exposed directly
	FileSize    int64      `json:"file_size"`
	Tags        JSONB      `gorm:"type:jsonb" json:"tags,omitempty"`
	UploadedAt  time.Time  `json:"uploaded_at"`
	DeletedAt   *time.Time `gorm:"index" json:"-"`
}

// DocumentDownloadResponse is returned by the download-url endpoint.
type DocumentDownloadResponse struct {
	URL       string `json:"url"`        // presigned URL — expires after ExpiresIn seconds
	ExpiresIn int    `json:"expires_in"` // seconds until expiry
}
