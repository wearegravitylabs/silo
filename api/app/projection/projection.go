// Package projection implements the Fast Forward feature — projecting future
// net worth under user-defined rules (growth, debt, income, spending).
package projection

import (
	"context"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/app/fx"
	"github.com/wearegravitylabs/silo/api/model"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

// milestones defines the output checkpoints (months from now).
var milestones = []struct {
	label  string
	months int
}{
	{"1M", 1},
	{"6M", 6},
	{"1Y", 12},
	{"5Y", 60},
	{"10Y", 120},
	{"20Y", 240},
	{"40Y", 480},
	{"50Y", 600},
}

// Projection manages fast-forward scenarios.
type Projection interface {
	CreateScenario(ctx context.Context, portfolioID uuid.UUID, req model.CreateScenarioRequest) (model.ProjectionScenario, error)
	GetScenario(ctx context.Context, id uuid.UUID) (model.ProjectionScenario, error)
	ListScenarios(ctx context.Context, portfolioID uuid.UUID) ([]model.ProjectionScenario, error)
	UpdateScenario(ctx context.Context, id uuid.UUID, req model.UpdateScenarioRequest) (model.ProjectionScenario, error)
	DeleteScenario(ctx context.Context, id uuid.UUID) error

	AddRule(ctx context.Context, scenarioID uuid.UUID, req model.CreateRuleRequest) (model.ProjectionRule, error)
	UpdateRule(ctx context.Context, ruleID uuid.UUID, req model.UpdateRuleRequest) (model.ProjectionRule, error)
	DeleteRule(ctx context.Context, ruleID uuid.UUID) error
	ToggleRule(ctx context.Context, ruleID uuid.UUID) (model.ProjectionRule, error)

	Compute(ctx context.Context, scenarioID, portfolioID uuid.UUID) (model.ProjectionResult, error)
	// Chart returns one point per month for plotting.
	Chart(ctx context.Context, scenarioID, portfolioID uuid.UUID, req model.ChartRequest) (model.ChartResult, error)
}

type service struct{ dp app.Dependency }

func New(dp app.Dependency) Projection { return &service{dp: dp} }

// ─── Scenario management ──────────────────────────────────────────────────────

// CreateScenario creates a new scenario and auto-imports existing autopilot rules.
func (s *service) CreateScenario(ctx context.Context, portfolioID uuid.UUID, req model.CreateScenarioRequest) (model.ProjectionScenario, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "projection.CreateScenario").
		Logger()

	now := time.Now().UTC()
	scenario := model.ProjectionScenario{
		PortfolioID: portfolioID,
		Name:        req.Name,
		Description: req.Description,
		Color:       req.Color,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	created, err := s.dp.ProjectionStore.CreateScenario(ctx, scenario)
	if err != nil {
		return model.ProjectionScenario{}, err
	}

	// Auto-import autopilot rules into this scenario.
	imported := s.importAutopilotRules(ctx, created.ID, portfolioID, now)
	log.Info().
		Str("scenario_id", created.ID.String()).
		Int("imported_rules", len(imported)).
		Msg("scenario created")

	created.Rules = imported
	return created, nil
}

// importAutopilotRules converts active autopilot rules into projection rules.
func (s *service) importAutopilotRules(ctx context.Context, scenarioID, portfolioID uuid.UUID, now time.Time) []model.ProjectionRule {
	apRules, err := s.dp.AutopilotStore.ListRulesByPortfolio(ctx, portfolioID)
	if err != nil || len(apRules) == 0 {
		return nil
	}

	var imported []model.ProjectionRule
	for _, ap := range apRules {
		var ruleType model.ProjectionRuleType
		config := model.JSONB{}

		switch {
		case ap.TargetType == model.TargetAsset && ap.Action == model.ActionAdd && ap.Percentage > 0:
			// Appreciation rule → asset_growth
			ruleType = model.RuleAssetGrowth
			config["asset_id"] = ap.TargetID.String()
			config["percentage"] = ap.Percentage
			config["frequency"] = string(ap.Frequency)

		// A fixed-amount buy (DCA) isn't imported: it moves money into the
		// asset, and no projection rule models a transfer, so it would show
		// up as new income.

		case ap.TargetType == model.TargetDebt && ap.Action == model.ActionRemove && ap.Amount > 0:
			// Debt payment → debt_payment
			ruleType = model.RuleDebtPayment
			config["debt_id"] = ap.TargetID.String()
			config["amount"] = ap.Amount
			config["frequency"] = string(ap.Frequency)

		default:
			continue
		}

		rule := model.ProjectionRule{
			ScenarioID: scenarioID,
			RuleType:   ruleType,
			IsActive:   true,
			Config:     config,
			CreatedAt:  now,
			UpdatedAt:  now,
		}
		if created, err := s.dp.ProjectionStore.AddRule(ctx, rule); err == nil {
			imported = append(imported, created)
		}
	}
	return imported
}

func (s *service) GetScenario(ctx context.Context, id uuid.UUID) (model.ProjectionScenario, error) {
	scenario, err := s.dp.ProjectionStore.GetScenarioByID(ctx, id)
	if err != nil {
		return model.ProjectionScenario{}, err
	}
	rules, _ := s.dp.ProjectionStore.ListRulesByScenario(ctx, id)
	scenario.Rules = rules
	return scenario, nil
}

func (s *service) ListScenarios(ctx context.Context, portfolioID uuid.UUID) ([]model.ProjectionScenario, error) {
	scenarios, err := s.dp.ProjectionStore.ListByPortfolio(ctx, portfolioID)
	if err != nil {
		return nil, err
	}
	// Attach rules to each scenario.
	for i := range scenarios {
		rules, _ := s.dp.ProjectionStore.ListRulesByScenario(ctx, scenarios[i].ID)
		scenarios[i].Rules = rules
	}
	return scenarios, nil
}

func (s *service) UpdateScenario(ctx context.Context, id uuid.UUID, req model.UpdateScenarioRequest) (model.ProjectionScenario, error) {
	scenario, err := s.dp.ProjectionStore.GetScenarioByID(ctx, id)
	if err != nil {
		return model.ProjectionScenario{}, err
	}
	if req.Name != nil {
		scenario.Name = *req.Name
	}
	if req.Description != nil {
		scenario.Description = *req.Description
	}
	if req.Color != nil {
		scenario.Color = *req.Color
	}
	scenario.UpdatedAt = time.Now().UTC()
	return s.dp.ProjectionStore.UpdateScenario(ctx, scenario)
}

func (s *service) DeleteScenario(ctx context.Context, id uuid.UUID) error {
	return s.dp.ProjectionStore.DeleteScenario(ctx, id)
}

// ─── Rule management ──────────────────────────────────────────────────────────

func (s *service) AddRule(ctx context.Context, scenarioID uuid.UUID, req model.CreateRuleRequest) (model.ProjectionRule, error) {
	now := time.Now().UTC()
	config := req.Config
	if config == nil {
		config = model.JSONB{}
	}
	if err := validateRule(req.RuleType, config); err != nil {
		return model.ProjectionRule{}, err
	}
	rule := model.ProjectionRule{
		ScenarioID: scenarioID,
		RuleType:   req.RuleType,
		IsActive:   true,
		Config:     config,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	return s.dp.ProjectionStore.AddRule(ctx, rule)
}

func (s *service) UpdateRule(ctx context.Context, ruleID uuid.UUID, req model.UpdateRuleRequest) (model.ProjectionRule, error) {
	rule, err := s.dp.ProjectionStore.GetRuleByID(ctx, ruleID)
	if err != nil {
		return model.ProjectionRule{}, err
	}
	if req.Config != nil {
		if err := validateRule(rule.RuleType, req.Config); err != nil {
			return model.ProjectionRule{}, err
		}
		rule.Config = req.Config
	}
	if req.IsActive != nil {
		rule.IsActive = *req.IsActive
	}
	rule.UpdatedAt = time.Now().UTC()
	return s.dp.ProjectionStore.UpdateRule(ctx, rule)
}

func (s *service) DeleteRule(ctx context.Context, ruleID uuid.UUID) error {
	return s.dp.ProjectionStore.DeleteRule(ctx, ruleID)
}

func (s *service) ToggleRule(ctx context.Context, ruleID uuid.UUID) (model.ProjectionRule, error) {
	rule, err := s.dp.ProjectionStore.GetRuleByID(ctx, ruleID)
	if err != nil {
		return model.ProjectionRule{}, err
	}
	rule.IsActive = !rule.IsActive
	rule.UpdatedAt = time.Now().UTC()
	return s.dp.ProjectionStore.UpdateRule(ctx, rule)
}

// ─── Computation ─────────────────────────────────────────────────────────────

// simulate loads a portfolio's starting position (owned shares in its base
// currency) and runs the engine for the given number of months.
func (s *service) simulate(ctx context.Context, scenarioID, portfolioID uuid.UUID, months int) (simulation, error) {
	scenario, err := s.dp.ProjectionStore.GetScenarioByID(ctx, scenarioID)
	if err != nil {
		return simulation{}, err
	}
	rules, err := s.dp.ProjectionStore.ListRulesByScenario(ctx, scenarioID)
	if err != nil {
		return simulation{}, err
	}
	portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, portfolioID)
	if err != nil {
		return simulation{}, err
	}
	conv := fx.New(s.dp, portfolio.BaseCurrency)

	assets, err := s.dp.AssetStore.ListAssetsByPortfolio(ctx, portfolioID, model.ListAssetsFilter{})
	if err != nil {
		return simulation{}, err
	}
	debts, err := s.dp.DebtStore.ListDebtsByPortfolio(ctx, portfolioID, model.ListDebtsFilter{})
	if err != nil {
		return simulation{}, err
	}

	in := engineInput{Start: time.Now().UTC(), Months: months}
	for _, a := range assets {
		owned := a.CurrentPrice * a.Quantity * a.OwnershipPct / 100
		in.Assets = append(in.Assets, engineAsset{
			ID: a.ID, Type: a.AssetType, Category: assetCategory(a),
			Value: conv.Convert(ctx, owned, a.Currency),
		})
	}
	for _, d := range debts {
		in.Debts = append(in.Debts, engineDebt{
			ID: d.ID, Balance: conv.Convert(ctx, d.Balance*d.OwnershipPct/100, d.Currency),
		})
	}
	for _, r := range rules {
		if r.IsActive {
			in.Rules = append(in.Rules, r)
		}
	}
	// "Until age" income uses the date of birth of the portfolio's owner.
	if owner, err := s.dp.UserStore.GetUserByID(ctx, portfolio.UserID); err == nil && owner.DateOfBirth != nil {
		dob := owner.DateOfBirth.Time()
		in.BirthDate = &dob
	}

	states, warnings := runEngine(in)
	if warnings == nil {
		warnings = []string{}
	}
	return simulation{scenario: scenario, currency: conv.To(), states: states, warnings: warnings}, nil
}

type simulation struct {
	scenario model.ProjectionScenario
	currency string
	states   []monthState
	warnings []string
}

// Compute runs the projection and returns milestone snapshots.
func (s *service) Compute(ctx context.Context, scenarioID, portfolioID uuid.UUID) (model.ProjectionResult, error) {
	sim, err := s.simulate(ctx, scenarioID, portfolioID, milestones[len(milestones)-1].months)
	if err != nil {
		return model.ProjectionResult{}, err
	}
	start := sim.states[0]
	startNW := start.Assets - start.Debts

	result := model.ProjectionResult{
		ScenarioID:       scenarioID,
		ScenarioName:     sim.scenario.Name,
		ComputedAt:       start.Date,
		StartingNetWorth: round2(startNW),
		StartingAssets:   round2(start.Assets),
		StartingDebts:    round2(start.Debts),
		Currency:         sim.currency,
		Warnings:         sim.warnings,
	}
	for _, m := range milestones {
		st := sim.states[m.months]
		nw := st.Assets - st.Debts
		change := round2(nw - startNW)
		pct := 0.0
		if startNW != 0 {
			pct = round2(change / math.Abs(startNW) * 100)
		}
		result.Milestones = append(result.Milestones, model.ProjectionMilestone{
			Label:              m.label,
			Months:             m.months,
			Year:               st.Date.Year(),
			NetWorth:           round2(nw),
			Assets:             round2(st.Assets),
			Debts:              round2(st.Debts),
			Cash:               round2(st.Cash),
			NetWorthWithCash:   round2(nw + st.Cash),
			ChangeAmount:       change,
			ChangePct:          pct,
			CumulativeIncome:   round2(st.Income),
			CumulativeExpenses: round2(st.Expenses),
		})
	}
	return result, nil
}

// Chart runs the projection and returns one point per month, from today
// (month 0) to years_ahead years out, plus the change from today to the end.
func (s *service) Chart(ctx context.Context, scenarioID, portfolioID uuid.UUID, req model.ChartRequest) (model.ChartResult, error) {
	years := req.YearsAhead
	if years <= 0 {
		years = 10
	}
	if years > 50 {
		years = 50
	}
	sim, err := s.simulate(ctx, scenarioID, portfolioID, years*12)
	if err != nil {
		return model.ChartResult{}, err
	}

	points := make([]model.ChartPoint, 0, len(sim.states))
	for _, st := range sim.states {
		nw := st.Assets - st.Debts
		points = append(points, model.ChartPoint{
			Label:            st.Date.Format("Jan 2006"),
			Date:             time.Date(st.Date.Year(), st.Date.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02"),
			Month:            st.Month,
			Year:             st.Date.Year(),
			NetWorth:         round2(nw),
			Assets:           round2(st.Assets),
			Debts:            round2(st.Debts),
			Cash:             round2(st.Cash),
			NetWorthWithCash: round2(nw + st.Cash),
		})
	}
	first, last := points[0], points[len(points)-1]
	return model.ChartResult{
		ScenarioID:           scenarioID,
		Granularity:          "monthly",
		YearsAhead:           years,
		Currency:             sim.currency,
		Points:               points,
		ChangeAmount:         round2(last.NetWorth - first.NetWorth),
		ChangePct:            fx.ChangePct(first.NetWorth, last.NetWorth),
		ChangeAmountWithCash: round2(last.NetWorthWithCash - first.NetWorthWithCash),
		ChangePctWithCash:    fx.ChangePct(first.NetWorthWithCash, last.NetWorthWithCash),
		Warnings:             sim.warnings,
	}, nil
}

// ─── Config helpers ───────────────────────────────────────────────────────────

// cfloat reads a number from a rule config. Numbers sent as strings ("7")
// are accepted too.
func cfloat(c model.JSONB, key string) float64 {
	switch v := c[key].(type) {
	case float64:
		return v
	case int:
		return float64(v)
	case string:
		f, _ := strconv.ParseFloat(strings.TrimSpace(v), 64)
		return f
	}
	return 0
}

// cstring reads a string from a rule config.
func cstring(c model.JSONB, key string) string {
	s, _ := c[key].(string)
	return strings.TrimSpace(s)
}

// cstrings reads a string or a list of strings from a rule config.
func cstrings(c model.JSONB, key string) []string {
	switch v := c[key].(type) {
	case string:
		return []string{v}
	case []any:
		out := make([]string, 0, len(v))
		for _, x := range v {
			if s, ok := x.(string); ok {
				out = append(out, s)
			}
		}
		return out
	}
	return nil
}

// cuuid reads an id from a rule config. ok is false when it is missing or
// not an id (e.g. "all" or "portfolio").
func cuuid(c model.JSONB, key string) (uuid.UUID, bool) {
	id, err := uuid.Parse(cstring(c, key))
	return id, err == nil
}

// ctime reads a date (YYYY-MM-DD or RFC 3339) from a rule config.
func ctime(c model.JSONB, key string) time.Time {
	s := cstring(c, key)
	if s == "" {
		return time.Time{}
	}
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t
	}
	t, _ := time.Parse("2006-01-02", s)
	return t
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
