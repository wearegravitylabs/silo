package model

import (
	"time"

	"github.com/google/uuid"
)

// PortfolioMemberRole defines the permission level of a portfolio member.
type PortfolioMemberRole string

const (
	RoleOwner  PortfolioMemberRole = "owner"
	RoleEditor PortfolioMemberRole = "editor"
	RoleViewer PortfolioMemberRole = "viewer"
)

// Portfolio is the top-level container for a user's financial life.
type Portfolio struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	Name        string     `gorm:"not null" json:"name"`
	Description string     `json:"description"`
	Currency    string     `gorm:"not null;default:'USD'" json:"currency"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index" json:"-"`

	Members []PortfolioMember `gorm:"foreignKey:PortfolioID" json:"members,omitempty"`
}

// PortfolioMember maps a user to a portfolio with a specific role.
type PortfolioMember struct {
	ID          uuid.UUID           `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	PortfolioID uuid.UUID           `gorm:"type:uuid;not null;uniqueIndex:portfolio_user_unique" json:"portfolio_id"`
	UserID      uuid.UUID           `gorm:"type:uuid;not null;uniqueIndex:portfolio_user_unique" json:"user_id"`
	Role        PortfolioMemberRole `gorm:"not null;default:'viewer'" json:"role"`
	InvitedBy   uuid.UUID           `gorm:"type:uuid" json:"invited_by"`
	CreatedAt   time.Time           `json:"created_at"`
}

// CreatePortfolioRequest is the input for creating a new portfolio.
type CreatePortfolioRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Currency    string `json:"currency"`
}

// UpdatePortfolioRequest is the input for updating portfolio metadata.
type UpdatePortfolioRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Currency    *string `json:"currency"`
}

// PortfolioMemberRequest is the input for inviting a member.
type PortfolioMemberRequest struct {
	Email string              `json:"email" binding:"required,email"`
	Role  PortfolioMemberRole `json:"role" binding:"required"`
}
