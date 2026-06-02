// Package insight implements AI-powered portfolio analysis.
package insight

import (
	"context"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
)

//go:generate mockgen -source insight.go -destination ../mock/insight/mock_insight.go -package insight Insight

// InsightResponse is the AI-generated portfolio summary.
type InsightResponse struct {
	Summary    string   `json:"summary"`
	Highlights []string `json:"highlights"`
	GeneratedAt string  `json:"generated_at"`
}

// FastForwardRequest defines the parameters for a future projection.
type FastForwardRequest struct {
	YearsAhead   int     `json:"years_ahead"`
	GrowthRatePct float64 `json:"growth_rate_pct"`
	MonthlyContribution float64 `json:"monthly_contribution"`
}

// ProjectionPoint is a single data point in a fast-forward projection.
type ProjectionPoint struct {
	Year     int     `json:"year"`
	NetWorth float64 `json:"net_worth"`
	Assets   float64 `json:"assets"`
	Debts    float64 `json:"debts"`
}

// Insight defines AI insight and projection operations.
type Insight interface {
	// DailySummary generates or retrieves the AI-generated daily portfolio summary.
	DailySummary(ctx context.Context, portfolioID uuid.UUID) (InsightResponse, error)
	// QueryNLP answers a natural language question about the portfolio (⌘K command bar).
	QueryNLP(ctx context.Context, portfolioID uuid.UUID, query string) (string, error)
	// FastForward projects future net worth under the given assumptions.
	FastForward(ctx context.Context, portfolioID uuid.UUID, req FastForwardRequest) ([]ProjectionPoint, error)
}

type service struct{ dp app.Dependency }

// New returns an Insight service.
func New(dp app.Dependency) Insight { return &service{dp: dp} }

func (s *service) DailySummary(ctx context.Context, portfolioID uuid.UUID) (InsightResponse, error) {
	// TODO: fetch snapshot diff, build prompt, call AIProvider.Complete
	panic("not implemented")
}

func (s *service) QueryNLP(ctx context.Context, portfolioID uuid.UUID, query string) (string, error) {
	// TODO: build context from portfolio state, call AIProvider.Complete
	panic("not implemented")
}

func (s *service) FastForward(ctx context.Context, portfolioID uuid.UUID, req FastForwardRequest) ([]ProjectionPoint, error) {
	// TODO: compound growth calculation with contributions
	panic("not implemented")
}
