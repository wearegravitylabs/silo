package model

import (
	"time"

	"github.com/google/uuid"
)

// User represents a registered Silo user.
type User struct {
	ID                  uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Email               string     `gorm:"uniqueIndex;not null" json:"email"`
	FirstName           string     `json:"first_name"`
	LastName            string     `json:"last_name"`
	Password            string     `json:"-"`
	IsActive            bool       `gorm:"default:false" json:"is_active"`
	IsEmailVerified     bool       `gorm:"default:false" json:"is_email_verified"`
	EmailOTPCode        string     `json:"-"`
	EmailOTPExpiry      *time.Time `json:"-"`
	ResetPWOTPCode      string     `json:"-"`
	ResetPWOTPExpiry    *time.Time `json:"-"`
	FailedLoginAttempts int        `gorm:"default:0" json:"-"`
	LockedUntil         *time.Time `json:"-"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
	DeletedAt           *time.Time `gorm:"index" json:"-"`
}

// UserSignup holds the data needed to register a new user.
type UserSignup struct {
	Email     string `json:"email" binding:"required,email"`
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Password  string `json:"password" binding:"required,min=8"`
}

// Password is a string type used to signal sensitive handling.
type Password = string
