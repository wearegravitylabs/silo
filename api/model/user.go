package model

import (
	"time"

	"github.com/google/uuid"
)

// User represents a Silo user authenticated via magic-link OTP.
type User struct {
	ID               uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Email            string    `gorm:"uniqueIndex;not null"                            json:"email"`
	FirstName        string    `json:"first_name"`
	LastName         string    `json:"last_name"`
	PhoneNumber      *string   `json:"phone_number"`
	PhoneCountryCode *string   `json:"phone_country_code"` // dial code, e.g. "+234"
	AvatarURL        *string   `json:"avatar_url"`
	// DateOfBirth is used for projections that run "until age N".
	DateOfBirth *DateOnly `gorm:"type:date" json:"date_of_birth"`
	// Settings holds small app settings the user's devices share (e.g.
	// "projections_intro_seen": true). PATCH /users/me merges keys into it.
	Settings        JSONB      `gorm:"type:jsonb;not null;default:'{}'" json:"settings"`
	IsEmailVerified bool       `gorm:"default:false"  json:"is_email_verified"`
	IsOnboarded     bool       `gorm:"default:false"  json:"is_onboarded"`
	PortfolioCount  int        `gorm:"default:0"      json:"portfolio_count"`
	OTPCode         string     `json:"-"`
	OTPExpiry       *time.Time `json:"-"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	DeletedAt       *time.Time `gorm:"index" json:"-"`
}

// ─── Auth request / response types ───────────────────────────────────────────

// SendCodeRequest is the payload for POST /auth/send-code.
type SendCodeRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// VerifyCodeRequest is the payload for POST /auth/verify-code.
type VerifyCodeRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code"  binding:"required,len=6"`
}

// RefreshTokenRequest is the payload for POST /auth/refresh-token.
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// AuthResponse is returned after a successful verify-code call.
type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         User   `json:"user"`
}

// ─── Onboarding types ────────────────────────────────────────────────────────

// OnboardRequest is the payload for PATCH /users/me/onboard.
// All three fields are required — onboarding is one atomic step.
type OnboardRequest struct {
	FirstName        string `json:"first_name"         binding:"required,min=1,max=100"`
	LastName         string `json:"last_name"          binding:"required,min=1,max=100"`
	PhoneNumber      string `json:"phone_number"       binding:"required"`
	PhoneCountryCode string `json:"phone_country_code" binding:"required"` // e.g. "+234"
}

// ─── Profile update types ─────────────────────────────────────────────────────

// UpdateProfileRequest is the payload for PATCH /users/me.
// All fields are optional — only provided ones are applied.
type UpdateProfileRequest struct {
	FirstName        *string `json:"first_name"`
	LastName         *string `json:"last_name"`
	PhoneNumber      *string `json:"phone_number"`
	PhoneCountryCode *string `json:"phone_country_code"`
	// AvatarURL sets the profile photo; null removes it.
	AvatarURL Optional[string] `json:"avatar_url"`
	// DateOfBirth is YYYY-MM-DD; null removes it.
	DateOfBirth Optional[DateOnly] `json:"date_of_birth"`
	// Settings is merged into the stored settings: keys sent replace those
	// keys, a key sent as null is removed, other keys are kept.
	Settings JSONB `json:"settings"`
}
