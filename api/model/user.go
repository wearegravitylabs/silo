package model

import (
	"time"

	"github.com/google/uuid"
)

// User represents a Silo user authenticated via magic-link OTP.
type User struct {
	ID              uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Email           string     `gorm:"uniqueIndex;not null"                            json:"email"`
	FirstName       string     `json:"first_name"`
	LastName        string     `json:"last_name"`
	IsEmailVerified bool       `gorm:"default:false"                                   json:"is_email_verified"`
	OTPCode         string     `json:"-"`
	OTPExpiry       *time.Time `json:"-"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	DeletedAt       *time.Time `gorm:"index"                                           json:"-"`
}

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
