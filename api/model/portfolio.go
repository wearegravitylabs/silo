package model

import (
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/pkg/currency"
)

// PortfolioMemberRole defines the permission level of a portfolio member.
type PortfolioMemberRole string

const (
	RoleOwner  PortfolioMemberRole = "owner"
	RoleEditor PortfolioMemberRole = "editor"
	RoleViewer PortfolioMemberRole = "viewer"
)

// PortfolioMemberStatus tracks the invitation lifecycle.
type PortfolioMemberStatus string

const (
	// MemberStatusInvited: invited by email, not accepted yet. No access.
	MemberStatusInvited PortfolioMemberStatus = "invited"
	// MemberStatusActive: a member with access.
	MemberStatusActive PortfolioMemberStatus = "active"
)

// Portfolio is the top-level container for a user's financial life.
type Portfolio struct {
	ID           uuid.UUID     `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID       uuid.UUID     `gorm:"type:uuid;not null;index"                         json:"user_id"`
	Name         string        `gorm:"not null"                                         json:"name"`
	Description  string        `json:"description"`
	BaseCurrency currency.Code `gorm:"not null;default:'USD'"                           json:"base_currency"`
	ImageURL     *string       `json:"image_url"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
	DeletedAt    *time.Time    `gorm:"index"                                            json:"-"`

	// Members is populated on explicit Preload only.
	Members []PortfolioMember `gorm:"foreignKey:PortfolioID" json:"members,omitempty"`
}

// PortfolioMember maps a user to a portfolio with a specific role.
type PortfolioMember struct {
	ID           uuid.UUID             `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"              json:"id"`
	PortfolioID  uuid.UUID             `gorm:"type:uuid;not null;uniqueIndex:portfolio_user_unique"          json:"portfolio_id"`
	UserID       uuid.UUID             `gorm:"type:uuid;not null;uniqueIndex:portfolio_user_unique"          json:"user_id"`
	Role         PortfolioMemberRole   `gorm:"not null;default:'viewer'"                                     json:"role"`
	Status       PortfolioMemberStatus `gorm:"not null;default:'active'"                                     json:"status"`
	InvitedBy    uuid.UUID             `gorm:"type:uuid"                                                     json:"invited_by"`
	InvitedEmail *string               `json:"invited_email,omitempty"`
	// JoinedAt is when the member accepted (null while invited).
	JoinedAt *time.Time `gorm:"column:accepted_at" json:"joined_at"`
	// Sections the member can open. Owners can open everything.
	Sections  Sections  `gorm:"type:text[]" json:"sections"`
	CreatedAt time.Time `json:"created_at"`

	// User is populated on explicit Preload only.
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// ─── Request / response types ─────────────────────────────────────────────────

// CreatePortfolioRequest is the payload for POST /portfolios.
type CreatePortfolioRequest struct {
	Name         string        `json:"name"          binding:"required,min=1,max=255"`
	Description  string        `json:"description"`
	BaseCurrency currency.Code `json:"base_currency" binding:"required"`
	ImageURL     *string       `json:"image_url"`
}

// UpdatePortfolioRequest is the payload for PATCH /portfolios/:id.
// All fields are optional.
type UpdatePortfolioRequest struct {
	Name         *string `json:"name"          binding:"omitempty,min=1,max=255"`
	Description  *string `json:"description"`
	BaseCurrency *string `json:"base_currency"`
	// ImageURL is cleared by sending null.
	ImageURL Optional[string] `json:"image_url"`
}

// InviteMemberRequest is the payload for POST /portfolios/:id/members.
type InviteMemberRequest struct {
	Email string              `json:"email" binding:"required,email"`
	Role  PortfolioMemberRole `json:"role"  binding:"required,oneof=owner editor viewer"`
	// Sections the new member can open. Defaults to everything but the vault.
	Sections *Sections `json:"sections"`
}

// PortfolioMemberRequest kept for backward compatibility — alias for InviteMemberRequest.
type PortfolioMemberRequest = InviteMemberRequest

// ─── List filter ─────────────────────────────────────────────────────────────

// ListPortfoliosFilter carries optional filter criteria for GET /portfolios.
type ListPortfoliosFilter struct {
	// Name performs a case-insensitive partial match on portfolio name.
	Name string `form:"name"`
	// Currency filters by base_currency (exact, case-insensitive).
	Currency currency.Code `form:"currency"`
	// Role filters portfolios where the caller has this specific role.
	Role PortfolioMemberRole `form:"role"`
}
