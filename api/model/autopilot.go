package model

import (
	"time"

	"github.com/google/uuid"
)

// AutopilotRuleType defines what the rule automates.
type AutopilotRuleType string

const (
	RuleTypeContribution  AutopilotRuleType = "contribution"  // adds value on a schedule
	RuleTypeAmortization  AutopilotRuleType = "amortization"  // reduces debt balance on a schedule
	RuleTypeInflation     AutopilotRuleType = "inflation"      // adjusts value by a % annually
)

// AutopilotRule is an automation rule attached to an asset or debt.
type AutopilotRule struct {
	ID          uuid.UUID         `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	PortfolioID uuid.UUID         `gorm:"type:uuid;not null;index" json:"portfolio_id"`
	RuleType    AutopilotRuleType `gorm:"not null" json:"rule_type"`
	TargetID    uuid.UUID         `gorm:"type:uuid" json:"target_id"` // asset or debt ID
	Amount      float64           `gorm:"type:numeric(28,10)" json:"amount"`
	Percentage  float64           `gorm:"type:numeric(8,4)" json:"percentage"` // alternative to fixed amount
	Frequency   PaymentFrequency  `json:"frequency"`
	StartDate   time.Time         `json:"start_date"`
	EndDate     *time.Time        `json:"end_date"`
	LastRunAt   *time.Time        `json:"last_run_at"`
	NextRunAt   *time.Time        `json:"next_run_at"`
	IsActive    bool              `gorm:"default:true" json:"is_active"`
	Metadata    JSONB             `gorm:"type:jsonb" json:"metadata,omitempty"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

// CreateAutopilotRuleRequest is the input for creating an automation rule.
type CreateAutopilotRuleRequest struct {
	RuleType   AutopilotRuleType `json:"rule_type" binding:"required"`
	TargetID   uuid.UUID         `json:"target_id" binding:"required"`
	Amount     float64           `json:"amount"`
	Percentage float64           `json:"percentage"`
	Frequency  PaymentFrequency  `json:"frequency" binding:"required"`
	StartDate  time.Time         `json:"start_date"`
	EndDate    *time.Time        `json:"end_date"`
}
