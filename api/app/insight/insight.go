// Package insight defines AI portfolio insights. The open-source server has
// no AI and answers ErrNotAvailable; silo-cloud supplies its own Insight.
package insight

import (
	"context"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
)

//go:generate mockgen -source insight.go -destination ../mock/insight/mock_insight.go -package insight Insight

// InsightResponse is one day's insight card: a title, a few short sections,
// and the figures to highlight.
type InsightResponse struct {
	Title      string             `json:"title"`
	Sections   []InsightSection   `json:"sections"`
	Highlights []InsightHighlight `json:"highlights"`
	// Date is the day the insight is for (YYYY-MM-DD); it is made once a day.
	Date        string `json:"date"`
	Currency    string `json:"currency"`
	GeneratedAt string `json:"generated_at"`
}

// InsightSection is a short heading and a paragraph or two.
type InsightSection struct {
	Heading string `json:"heading"`
	Body    string `json:"body"`
}

// InsightHighlight is a key figure the card shows in bold.
type InsightHighlight struct {
	Label string `json:"label"`
	// Value is the figure as text, e.g. "$210,758" or "+4.2%".
	Value string `json:"value"`
	// Tone tells the app how to colour it: "positive", "negative" or "neutral".
	Tone string `json:"tone"`
}

// FastForwardRequest defines the parameters for a future projection.
type FastForwardRequest struct {
	YearsAhead          int     `json:"years_ahead"`
	GrowthRatePct       float64 `json:"growth_rate_pct"`
	MonthlyContribution float64 `json:"monthly_contribution"`
}

// ProjectionPoint is a single data point in a fast-forward projection.
type ProjectionPoint struct {
	Year     int     `json:"year"`
	NetWorth float64 `json:"net_worth"`
	Assets   float64 `json:"assets"`
	Debts    float64 `json:"debts"`
}

// Insight defines AI insight operations.
type Insight interface {
	// DailySummary returns today's insight card for the portfolio.
	DailySummary(ctx context.Context, portfolioID uuid.UUID) (InsightResponse, error)
	// QueryNLP answers a natural language question about the portfolio.
	QueryNLP(ctx context.Context, portfolioID uuid.UUID, query string) (string, error)
	// FastForward projects future net worth under simple assumptions. The
	// projections feature (scenarios and rules) replaces it.
	FastForward(ctx context.Context, portfolioID uuid.UUID, req FastForwardRequest) ([]ProjectionPoint, error)
}

type service struct{ dp app.Dependency }

// New returns the open-source Insight, which has no AI behind it.
func New(dp app.Dependency) Insight { return &service{dp: dp} }

func (s *service) DailySummary(context.Context, uuid.UUID) (InsightResponse, error) {
	return InsightResponse{}, siloErrors.ErrNotAvailable
}

func (s *service) QueryNLP(context.Context, uuid.UUID, string) (string, error) {
	return "", siloErrors.ErrNotAvailable
}

func (s *service) FastForward(context.Context, uuid.UUID, FastForwardRequest) ([]ProjectionPoint, error) {
	return nil, siloErrors.ErrNotAvailable
}
