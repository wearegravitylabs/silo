// Package autopilot implements automated portfolio update rules.
package autopilot

import (
	"context"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source autopilot.go -destination ../mock/autopilot/mock_autopilot.go -package autopilot Autopilot

// Autopilot defines automation rule management and execution.
type Autopilot interface {
	CreateRule(ctx context.Context, req model.CreateAutopilotRuleRequest) (model.AutopilotRule, error)
	GetRule(ctx context.Context, id uuid.UUID) (model.AutopilotRule, error)
	ListByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.AutopilotRule, error)
	PauseRule(ctx context.Context, id uuid.UUID) error
	ResumeRule(ctx context.Context, id uuid.UUID) error
	DeleteRule(ctx context.Context, id uuid.UUID) error
	// RunDue executes all rules whose next_run_at is in the past. Called by the daily job.
	RunDue(ctx context.Context) error
}

type service struct{ dp app.Dependency }

// New returns an Autopilot service.
func New(dp app.Dependency) Autopilot { return &service{dp: dp} }

func (s *service) CreateRule(ctx context.Context, req model.CreateAutopilotRuleRequest) (model.AutopilotRule, error) {
	panic("not implemented")
}

func (s *service) GetRule(ctx context.Context, id uuid.UUID) (model.AutopilotRule, error) {
	return s.dp.AutopilotStore.GetRuleByID(ctx, id)
}

func (s *service) ListByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.AutopilotRule, error) {
	return s.dp.AutopilotStore.ListRulesByPortfolio(ctx, portfolioID)
}

func (s *service) PauseRule(ctx context.Context, id uuid.UUID) error {
	panic("not implemented")
}

func (s *service) ResumeRule(ctx context.Context, id uuid.UUID) error {
	panic("not implemented")
}

func (s *service) DeleteRule(ctx context.Context, id uuid.UUID) error {
	return s.dp.AutopilotStore.DeleteRule(ctx, id)
}

func (s *service) RunDue(ctx context.Context) error {
	// TODO: fetch due rules, execute each (contribution → increase asset; amortization → decrease debt balance)
	panic("not implemented")
}
