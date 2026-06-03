package model

import (
	"time"

	"github.com/google/uuid"
)

// RefreshToken stores a SHA-256 hash of an opaque refresh token issued on login.
// SHA-256 is used (not bcrypt) because the hash must be deterministic for lookup.
// The raw token is a 32-byte random hex string held only by the client.
type RefreshToken struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null;index"                         json:"user_id"`
	TokenHash string     `gorm:"not null"                                         json:"-"`
	ExpiresAt time.Time  `gorm:"not null"                                         json:"expires_at"`
	CreatedAt time.Time  `json:"created_at"`
	RevokedAt *time.Time `json:"-"`
}
