package model

import (
	"database/sql/driver"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Sections a member (or a public link) can be allowed to open.
const (
	SectionDashboard   = "dashboard"
	SectionInsights    = "insights"
	SectionAssets      = "assets"
	SectionDebts       = "debts"
	SectionVault       = "vault"
	SectionProjections = "projections"
)

// AllSections lists every section, in the app's order.
var AllSections = Sections{SectionDashboard, SectionInsights, SectionAssets, SectionDebts, SectionVault, SectionProjections}

// DefaultMemberSections is what a new member sees unless the owner picks:
// everything but the vault.
var DefaultMemberSections = Sections{SectionDashboard, SectionInsights, SectionAssets, SectionDebts, SectionProjections}

// Sections is a list of section names, stored as a Postgres TEXT[].
type Sections []string

// Valid reports whether every entry is a known section and none repeats.
func (s Sections) Valid() bool {
	seen := map[string]bool{}
	for _, x := range s {
		known := false
		for _, a := range AllSections {
			known = known || x == a
		}
		if !known || seen[x] {
			return false
		}
		seen[x] = true
	}
	return true
}

// Has reports whether the list includes the section.
func (s Sections) Has(section string) bool {
	for _, x := range s {
		if x == section {
			return true
		}
	}
	return false
}

// Value writes the list as a Postgres array literal.
func (s Sections) Value() (driver.Value, error) {
	return "{" + strings.Join(s, ",") + "}", nil
}

// Scan reads a Postgres array literal like {dashboard,assets}.
func (s *Sections) Scan(v any) error {
	var raw string
	switch t := v.(type) {
	case []byte:
		raw = string(t)
	case string:
		raw = t
	case nil:
		*s = Sections{}
		return nil
	default:
		return fmt.Errorf("cannot scan %T into Sections", v)
	}
	raw = strings.Trim(raw, "{}")
	if raw == "" {
		*s = Sections{}
		return nil
	}
	parts := strings.Split(raw, ",")
	for i := range parts {
		parts[i] = strings.Trim(parts[i], `"`)
	}
	*s = parts
	return nil
}

// InviteLink is a portfolio's copyable link; opening it lets someone ask to join.
type InviteLink struct {
	ID          uuid.UUID           `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"-"`
	PortfolioID uuid.UUID           `gorm:"type:uuid;not null"                               json:"portfolio_id"`
	Token       string              `gorm:"not null"                                         json:"token"`
	Role        PortfolioMemberRole `gorm:"not null"                                         json:"role"`
	CreatedBy   uuid.UUID           `gorm:"type:uuid;not null"                               json:"-"`
	RevokedAt   *time.Time          `json:"-"`
	CreatedAt   time.Time           `json:"created_at"`

	// URL is the link to share (APP_BASE_URL/join/<token>). Not stored.
	URL string `gorm:"-" json:"url"`
}

// TableName pins the table name.
func (InviteLink) TableName() string { return "portfolio_invite_links" }

// Access request statuses.
const (
	AccessRequestPending  = "pending"
	AccessRequestApproved = "approved"
	AccessRequestDeclined = "declined"
)

// AccessRequest is someone asking to join a portfolio through its invite link.
type AccessRequest struct {
	ID          uuid.UUID           `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	PortfolioID uuid.UUID           `gorm:"type:uuid;not null"                               json:"portfolio_id"`
	UserID      uuid.UUID           `gorm:"type:uuid;not null"                               json:"user_id"`
	Role        PortfolioMemberRole `gorm:"not null"                                         json:"role"`
	Status      string              `gorm:"not null"                                         json:"status"`
	DecidedBy   *uuid.UUID          `gorm:"type:uuid"                                        json:"decided_by,omitempty"`
	DecidedAt   *time.Time          `json:"decided_at,omitempty"`
	CreatedAt   time.Time           `json:"created_at"`

	// User is filled for the owner's list of requests.
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName pins the table name.
func (AccessRequest) TableName() string { return "portfolio_access_requests" }

// PublicLink is a read-only link to some sections of a portfolio, for people
// without an account.
type PublicLink struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"-"`
	PortfolioID uuid.UUID  `gorm:"type:uuid;not null"                               json:"portfolio_id"`
	Token       string     `gorm:"not null"                                         json:"token"`
	Sections    Sections   `gorm:"type:text[];not null"                             json:"sections"`
	CreatedBy   uuid.UUID  `gorm:"type:uuid;not null"                               json:"-"`
	RevokedAt   *time.Time `json:"-"`
	CreatedAt   time.Time  `json:"created_at"`

	// URL is the link to share (APP_BASE_URL/share/<token>). Not stored.
	URL string `gorm:"-" json:"url"`
}

// TableName pins the table name.
func (PublicLink) TableName() string { return "portfolio_public_links" }

// ─── Requests and responses ──────────────────────────────────────────────────

// UpdateMemberRequest is the body of PATCH /portfolios/:id/members/:userID.
type UpdateMemberRequest struct {
	Role     *PortfolioMemberRole `json:"role" binding:"omitempty,oneof=owner editor viewer"`
	Sections *Sections            `json:"sections"`
}

// InviteLinkRequest is the body of POST /portfolios/:id/invite-link.
type InviteLinkRequest struct {
	// Role people who join through the link get (owner can change it when
	// approving). Defaults to viewer.
	Role PortfolioMemberRole `json:"role" binding:"omitempty,oneof=editor viewer"`
}

// DecideAccessRequest is the body of approving a request (both optional).
type DecideAccessRequest struct {
	Role     *PortfolioMemberRole `json:"role" binding:"omitempty,oneof=owner editor viewer"`
	Sections *Sections            `json:"sections"`
}

// PublicLinkRequest is the body of POST /portfolios/:id/public-link.
type PublicLinkRequest struct {
	Sections Sections `json:"sections" binding:"required,min=1"`
}

// InvitePreview is what someone sees on opening an invite link or an email
// invite, before joining.
type InvitePreview struct {
	PortfolioID   uuid.UUID           `json:"portfolio_id"`
	PortfolioName string              `json:"portfolio_name"`
	ImageURL      *string             `json:"image_url"`
	InvitedBy     string              `json:"invited_by"` // the inviter's name
	Role          PortfolioMemberRole `json:"role"`
	Sections      Sections            `json:"sections,omitempty"`
	InvitedAt     time.Time           `json:"invited_at"`
}

// PublicView is what a public link shows: only the sections it allows.
type PublicView struct {
	PortfolioName string               `json:"portfolio_name"`
	ImageURL      *string              `json:"image_url"`
	Currency      string               `json:"currency"`
	Sections      Sections             `json:"sections"`
	Dashboard     *DashboardResponse   `json:"dashboard,omitempty"`
	Assets        []Asset              `json:"assets,omitempty"`
	Debts         []Debt               `json:"debts,omitempty"`
	Projections   []ProjectionScenario `json:"projections,omitempty"`
	// ProjectionCharts has a 10-year chart per scenario, in the same order.
	ProjectionCharts []ChartResult `json:"projection_charts,omitempty"`
}
