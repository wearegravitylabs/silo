package model

import (
	"time"

	"github.com/google/uuid"
)

// VaultDocument is a client-side-encrypted file stored in the Vault.
// The server only sees ciphertext blobs — plaintext never leaves the client.
type VaultDocument struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	PortfolioID uuid.UUID `gorm:"type:uuid;not null;index" json:"portfolio_id"`
	FileName    string    `gorm:"not null" json:"file_name"`
	FileType    string    `gorm:"not null" json:"file_type"`
	StoragePath string    `gorm:"not null" json:"-"` // path in object storage
	FileSize    int64     `json:"file_size"`
	Tags        JSONB     `gorm:"type:jsonb" json:"tags,omitempty"`
	// Encrypted is true when the browser encrypted the file before upload;
	// Encryption is how (e.g. {"alg":"AES-GCM","iv":"…","key_version":1}),
	// stored as sent. Files from before vault passwords have encrypted=false.
	Encrypted  bool       `gorm:"not null;default:false" json:"encrypted"`
	Encryption JSONB      `gorm:"type:jsonb" json:"encryption,omitempty"`
	UploadedAt time.Time  `json:"uploaded_at"`
	DeletedAt  *time.Time `gorm:"index" json:"-"`
}

// PortfolioVault holds a portfolio's wrapped vault key. See migration
// 20261117000026 for how the pieces fit.
type PortfolioVault struct {
	PortfolioID  uuid.UUID  `gorm:"type:uuid;primary_key"`
	WrappedKey   string     `gorm:"not null"`
	Salt         string     `gorm:"not null"`
	KDF          JSONB      `gorm:"column:kdf;type:jsonb;not null"`
	VerifierHash string     `gorm:"not null"`
	KeyVersion   int        `gorm:"not null;default:1"`
	SetBy        *uuid.UUID `gorm:"type:uuid"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// TableName pins the table name.
func (PortfolioVault) TableName() string { return "portfolio_vaults" }

// VaultStatus is GET /vault/status: what the browser needs before unlocking.
type VaultStatus struct {
	PasswordSet bool `json:"password_set"`
	// Salt and KDF derive the keys from the password (null until set).
	Salt       *string `json:"salt"`
	KDF        JSONB   `json:"kdf"`
	KeyVersion int     `json:"key_version"`
	// AutoLockMinutes is the caller's vault.auto_lock_minutes setting (0 = never).
	AutoLockMinutes int `json:"auto_lock_minutes"`
	// LockedUntil is set while unlocking is blocked after wrong tries.
	LockedUntil *time.Time `json:"locked_until"`
}

// SetVaultPasswordRequest is the body of POST /vault/password (first time).
type SetVaultPasswordRequest struct {
	// WrappedKey is the vault key encrypted with the password-derived key (base64).
	WrappedKey string `json:"wrapped_key" binding:"required"`
	Salt       string `json:"salt"        binding:"required"`
	// KDF describes the derivation, e.g. {"name":"PBKDF2","hash":"SHA-256","iterations":600000}.
	KDF JSONB `json:"kdf" binding:"required"`
	// Verifier is a second value derived from the password (base64); the
	// server stores only its hash and checks it on unlock.
	Verifier string `json:"verifier" binding:"required,min=16"`
}

// ChangeVaultPasswordRequest is the body of POST /vault/password/change. The
// browser unlocks with the old password, re-wraps the same vault key with
// the new one, and sends it with the emailed code.
type ChangeVaultPasswordRequest struct {
	Code        string `json:"code"         binding:"required"`
	OldVerifier string `json:"old_verifier" binding:"required"`
	SetVaultPasswordRequest
}

// UnlockVaultRequest is the body of POST /vault/unlock.
type UnlockVaultRequest struct {
	Verifier string `json:"verifier" binding:"required"`
}

// UnlockVaultResponse hands the browser the wrapped key to unwrap locally.
type UnlockVaultResponse struct {
	WrappedKey string `json:"wrapped_key"`
	KeyVersion int    `json:"key_version"`
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
