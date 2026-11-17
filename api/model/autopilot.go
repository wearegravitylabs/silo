package model

import (
	"time"

	"github.com/google/uuid"
)

// AutopilotAction defines whether the rule adds or removes value.
type AutopilotAction string

const (
	ActionAdd    AutopilotAction = "add"
	ActionRemove AutopilotAction = "remove"
)

// AutopilotTargetType identifies whether the rule applies to an asset or a debt.
type AutopilotTargetType string

const (
	TargetAsset AutopilotTargetType = "asset"
	TargetDebt  AutopilotTargetType = "debt"
)

// AutopilotRule is an automation rule attached to an asset or debt.
type AutopilotRule struct {
	ID          uuid.UUID           `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	PortfolioID uuid.UUID           `gorm:"type:uuid;not null;index"                         json:"portfolio_id"`
	TargetID    uuid.UUID           `gorm:"type:uuid"                                        json:"target_id"`
	TargetType  AutopilotTargetType `gorm:"not null;default:'asset'"                         json:"target_type"`
	Action      AutopilotAction     `gorm:"not null;default:'add'"                           json:"action"`

	// Value specification — exactly one of the three should be set:
	Amount     float64  `gorm:"type:numeric(28,10)"  json:"amount"`          // fixed dollar/currency amount
	Percentage float64  `gorm:"type:numeric(8,4)"    json:"percentage"`      // % of current value
	Units      *float64 `gorm:"type:numeric(28,10)"  json:"units,omitempty"` // fixed qty for ticker DCA (e.g. 1 TSLA)

	Frequency PaymentFrequency `json:"frequency"`
	StartDate time.Time        `json:"start_date"`
	EndDate   *time.Time       `json:"end_date,omitempty"`
	LastRunAt *time.Time       `json:"last_run_at,omitempty"`
	NextRunAt *time.Time       `json:"next_run_at,omitempty"`
	IsActive  bool             `gorm:"default:true"         json:"is_active"`
	Metadata  JSONB            `gorm:"type:jsonb"           json:"metadata,omitempty"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
}

// UpdateAutopilotRuleRequest is the input for PATCH /autopilot/rules/:id.
// Everything but the target (target_id, target_type, action) can change.
// After the change exactly one of amount, percentage and units must be set:
// to switch from amount to percentage, send "amount": 0 with the percentage.
type UpdateAutopilotRuleRequest struct {
	Amount     *float64            `json:"amount"`
	Percentage *float64            `json:"percentage"`
	Units      Optional[float64]   `json:"units"`
	Frequency  *PaymentFrequency   `json:"frequency"`
	StartDate  *time.Time          `json:"start_date"`
	EndDate    Optional[time.Time] `json:"end_date"`
}

// ListAutopilotRulesFilter narrows GET /autopilot/rules.
type ListAutopilotRulesFilter struct {
	// TargetID lists only the rules of one asset or debt.
	TargetID *uuid.UUID
}

// CreateAutopilotRuleRequest is the input for creating an automation rule.
type CreateAutopilotRuleRequest struct {
	TargetID   uuid.UUID           `json:"target_id"   binding:"required"`
	TargetType AutopilotTargetType `json:"target_type" binding:"required"` // asset | debt
	Action     AutopilotAction     `json:"action"      binding:"required"` // add | remove

	// Provide exactly one:
	Amount     float64  `json:"amount"`     // dollar/currency amount
	Percentage float64  `json:"percentage"` // % of current value
	Units      *float64 `json:"units"`      // fixed quantity (ticker assets only)

	Frequency PaymentFrequency `json:"frequency" binding:"required"`
	StartDate time.Time        `json:"start_date"`
	EndDate   *time.Time       `json:"end_date"`
}
