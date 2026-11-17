package model

import (
	"time"

	"github.com/google/uuid"
)

// ConfirmationPurpose is the risky action an emailed code confirms.
type ConfirmationPurpose string

const (
	PurposeDeleteAccount   ConfirmationPurpose = "delete_account"
	PurposeDeletePortfolio ConfirmationPurpose = "delete_portfolio"
)

// ConfirmationCode is a 6-digit code emailed to confirm a risky action.
type ConfirmationCode struct {
	ID        uuid.UUID           `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID    uuid.UUID           `gorm:"type:uuid;not null"`
	Purpose   ConfirmationPurpose `gorm:"not null"`
	TargetID  *uuid.UUID          `gorm:"type:uuid"`
	CodeHash  string              `gorm:"not null"`
	Attempts  int                 `gorm:"not null;default:0"`
	ExpiresAt time.Time           `gorm:"not null"`
	UsedAt    *time.Time
	CreatedAt time.Time
}

// EmailChange is a pending change of a user's email address.
type EmailChange struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null"`
	NewEmail  string    `gorm:"not null"`
	TokenHash string    `gorm:"not null"`
	ExpiresAt time.Time `gorm:"not null"`
	UsedAt    *time.Time
	CreatedAt time.Time
}

// SendConfirmationCodeRequest is the body of POST /users/me/confirmation-code.
type SendConfirmationCodeRequest struct {
	Purpose ConfirmationPurpose `json:"purpose" binding:"required,oneof=delete_account delete_portfolio"`
	// PortfolioID is required for delete_portfolio.
	PortfolioID *uuid.UUID `json:"portfolio_id"`
}

// CodeRequest carries the emailed code on DELETE /users/me and
// DELETE /portfolios/:id.
type CodeRequest struct {
	Code string `json:"code" binding:"required"`
}

// ChangeEmailRequest is the body of POST /users/me/email.
type ChangeEmailRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ConfirmEmailChangeRequest is the body of POST /auth/confirm-email-change.
type ConfirmEmailChangeRequest struct {
	Token string `json:"token" binding:"required"`
}

// LogoutRequest is the body of POST /auth/logout.
type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
	// AllDevices signs the user out everywhere, not just this device.
	AllDevices bool `json:"all_devices"`
}

// EmailAvailability is the response of GET /users/email-available.
type EmailAvailability struct {
	Email     string `json:"email"`
	Available bool   `json:"available"`
}
