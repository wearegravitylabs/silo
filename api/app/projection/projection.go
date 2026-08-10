// Package projection implements the Fast Forward feature — projecting future
// net worth under user-defined rules (growth, debt, income, spending).
package projection

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
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
	// Chart returns granular data points for plotting.
	// Granularity: monthly (≤2 years) or yearly (>2 years).
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

		case ap.TargetType == model.TargetAsset && ap.Action == model.ActionAdd && ap.Amount > 0:
			// Dollar DCA → asset_income (adds to asset value each period)
			ruleType = model.RuleAssetIncome
			config["asset_id"] = ap.TargetID.String()
			config["amount"] = ap.Amount
			config["frequency"] = string(ap.Frequency)

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

// ─── Computation engine ───────────────────────────────────────────────────────

// Compute runs the projection and returns milestone snapshots.
func (s *service) Compute(ctx context.Context, scenarioID, portfolioID uuid.UUID) (model.ProjectionResult, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "projection.Compute").
		Str("scenario_id", scenarioID.String()).
		Logger()

	// Fetch scenario + rules.
	scenario, err := s.dp.ProjectionStore.GetScenarioByID(ctx, scenarioID)
	if err != nil {
		return model.ProjectionResult{}, err
	}
	rules, err := s.dp.ProjectionStore.ListRulesByScenario(ctx, scenarioID)
	if err != nil {
		return model.ProjectionResult{}, err
	}

	// Fetch portfolio for base currency.
	portfolio, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, portfolioID, uuid.Nil)
	if err != nil {
		return model.ProjectionResult{}, err
	}

	// Compute starting state from live portfolio data.
	assets, err := s.dp.AssetStore.ListAssetsByPortfolio(ctx, portfolioID, model.ListAssetsFilter{})
	if err != nil {
		return model.ProjectionResult{}, err
	}
	debts, err := s.dp.DebtStore.ListDebtsByPortfolio(ctx, portfolioID, model.ListDebtsFilter{})
	if err != nil {
		return model.ProjectionResult{}, err
	}

	var startAssets, startDebts float64
	for _, a := range assets {
		startAssets += a.CurrentPrice * a.Quantity * (a.OwnershipPct / 100)
	}
	for _, d := range debts {
		startDebts += d.Balance * (d.OwnershipPct / 100)
	}
	startAssets = round2(startAssets)
	startDebts = round2(startDebts)

	// Filter to active rules only.
	var activeRules []model.ProjectionRule
	for _, r := range rules {
		if r.IsActive {
			activeRules = append(activeRules, r)
		}
	}

	// Separate inflation rate rule (applied to expense amounts each month).
	inflationRateMonthly := 0.0
	for _, r := range activeRules {
		if r.RuleType == model.RuleInflationRate {
			annualPct := cfloat(r.Config, "percentage")
			inflationRateMonthly = annualPct / 100 / 12
		}
	}

	// Run month-by-month simulation.
	now := time.Now().UTC()
	assetsVal := startAssets
	debtsVal := startDebts
	inflationFactor := 1.0 // cumulative inflation multiplier for expenses

	var cumIncome, cumExpenses float64

	var projMilestones []model.ProjectionMilestone
	milestoneIdx := 0

	for month := 1; month <= 600 && milestoneIdx < len(milestones); month++ {
		currentDate := now.AddDate(0, month, 0)
		inflationFactor *= (1 + inflationRateMonthly)

		var monthIncome, monthExpenses float64

		for _, r := range activeRules {
			c := r.Config
			switch r.RuleType {

			// ── Growth ─────────────────────────────────────────────────────────
			case model.RulePortfolioGrowth:
				pct := cfloat(c, "percentage")
				freq := cfreq(c, "frequency")
				assetsVal += assetsVal * (pct / 100 / freq)

			case model.RuleAssetTypeGrowth:
				pct := cfloat(c, "percentage")
				freq := cfreq(c, "frequency")
				// Apply to matching asset type's proportion of total (approximate).
				assetsVal += assetsVal * (pct / 100 / freq)

			case model.RuleAssetGrowth:
				pct := cfloat(c, "percentage")
				freq := cfreq(c, "frequency")
				assetsVal += assetsVal * (pct / 100 / freq)

			case model.RuleAssetTargetValue:
				targetVal := cfloat(c, "target_value")
				byYear := int(cfloat(c, "by_year"))
				targetMonth := (byYear - now.Year()) * 12
				if month == targetMonth && targetVal > 0 {
					// Clamp assets toward target (rough approximation).
					assetsVal = math.Max(assetsVal, targetVal)
				}

			// ── Debt management ────────────────────────────────────────────────
			case model.RuleDebtInterest:
				pct := cfloat(c, "percentage")
				debtsVal += debtsVal * (pct / 100 / 12)

			case model.RuleDebtPayment:
				amount := cfloat(c, "amount")
				freq := cfreq(c, "frequency")
				monthlyPayment := amount / freq
				startDate := ctime(c, "start_date")
				if startDate.IsZero() || !currentDate.Before(startDate) {
					debtsVal = math.Max(0, debtsVal-monthlyPayment)
				}

			case model.RuleDebtAccelerated:
				pct := cfloat(c, "percentage")
				debtsVal = math.Max(0, debtsVal-debtsVal*(pct/100/12))

			case model.RuleDebtFreeGoal:
				targetMonths := int(cfloat(c, "months"))
				if month >= targetMonths {
					debtsVal = 0
				}

			// ── Income ─────────────────────────────────────────────────────────
			case model.RuleEmploymentIncome:
				amount := cfloat(c, "amount")
				freq := cfreq(c, "frequency")
				annualIncrease := cfloat(c, "annual_increase_pct")
				untilYear := int(cfloat(c, "until_year"))
				if untilYear == 0 || currentDate.Year() <= untilYear {
					yearsIn := float64(currentDate.Year() - now.Year())
					growth := math.Pow(1+annualIncrease/100, yearsIn)
					inc := (amount * growth) / freq
					assetsVal += inc
					monthIncome += inc
				}

			case model.RuleAssetIncome:
				amount := cfloat(c, "amount")
				freq := cfreq(c, "frequency")
				inc := amount / freq
				assetsVal += inc
				monthIncome += inc

			case model.RuleOneTimeIncome:
				amount := cfloat(c, "amount")
				eventDate := ctime(c, "date")
				if !eventDate.IsZero() {
					eventMonth := monthsBetween(now, eventDate)
					if month == eventMonth {
						assetsVal += amount
						monthIncome += amount
					}
				}

			case model.RuleFutureIncome:
				amount := cfloat(c, "amount")
				freq := cfreq(c, "frequency")
				startDate := ctime(c, "start_date")
				if !startDate.IsZero() && !currentDate.Before(startDate) {
					inc := amount / freq
					assetsVal += inc
					monthIncome += inc
				}

			// ── Spending ───────────────────────────────────────────────────────
			case model.RuleRegularExpense:
				amount := cfloat(c, "amount")
				freq := cfreq(c, "frequency")
				exp := (amount * inflationFactor) / freq
				assetsVal = math.Max(0, assetsVal-exp)
				monthExpenses += exp

			case model.RuleAssetExpense:
				amount := cfloat(c, "amount")
				freq := cfreq(c, "frequency")
				exp := (amount * inflationFactor) / freq
				assetsVal = math.Max(0, assetsVal-exp)
				monthExpenses += exp

			case model.RuleManagementFee:
				pct := cfloat(c, "percentage")
				exp := assetsVal * (pct / 100 / 12)
				assetsVal = math.Max(0, assetsVal-exp)
				monthExpenses += exp

			case model.RulePlannedPurchase:
				amount := cfloat(c, "amount")
				purchaseDate := ctime(c, "date")
				if !purchaseDate.IsZero() {
					purchaseMonth := monthsBetween(now, purchaseDate)
					if month == purchaseMonth {
						assetsVal = math.Max(0, assetsVal-amount)
						monthExpenses += amount
					}
				}

			case model.RuleFutureObligation:
				amount := cfloat(c, "amount")
				freq := cfreq(c, "frequency")
				startDate := ctime(c, "start_date")
				if !startDate.IsZero() && !currentDate.Before(startDate) {
					exp := (amount * inflationFactor) / freq
					assetsVal = math.Max(0, assetsVal-exp)
					monthExpenses += exp
				}
			}
		}

		assetsVal = round2(math.Max(0, assetsVal))
		debtsVal = round2(math.Max(0, debtsVal))
		cumIncome += round2(monthIncome)
		cumExpenses += round2(monthExpenses)

		// Capture milestone if this month matches.
		if milestoneIdx < len(milestones) && month == milestones[milestoneIdx].months {
			nw := round2(assetsVal - debtsVal)
			changeAmt := round2(nw - (startAssets - startDebts))
			changePct := 0.0
			if startNetWorth := startAssets - startDebts; startNetWorth != 0 {
				changePct = round2((changeAmt / math.Abs(startNetWorth)) * 100)
			}
			projMilestones = append(projMilestones, model.ProjectionMilestone{
				Label:              milestones[milestoneIdx].label,
				Months:             month,
				Year:               currentDate.Year(),
				NetWorth:           nw,
				Assets:             assetsVal,
				Debts:              debtsVal,
				ChangeAmount:       changeAmt,
				ChangePct:          changePct,
				CumulativeIncome:   round2(cumIncome),
				CumulativeExpenses: round2(cumExpenses),
			})
			milestoneIdx++
		}
	}

	log.Info().Int("milestones", len(projMilestones)).Msg("projection computed")

	return model.ProjectionResult{
		ScenarioID:       scenarioID,
		ScenarioName:     scenario.Name,
		ComputedAt:       now,
		StartingNetWorth: round2(startAssets - startDebts),
		StartingAssets:   startAssets,
		StartingDebts:    startDebts,
		Currency:         string(portfolio.BaseCurrency),
		Milestones:       projMilestones,
	}, nil
}

// Chart runs the projection engine and returns granular data points for charting.
// Granularity is monthly for ≤2 years, yearly for >2 years.
// Always includes month 0 (current state) as the first point.
func (s *service) Chart(ctx context.Context, scenarioID, portfolioID uuid.UUID, req model.ChartRequest) (model.ChartResult, error) {
	yearsAhead := req.YearsAhead
	if yearsAhead <= 0 {
		yearsAhead = 10
	}
	if yearsAhead > 50 {
		yearsAhead = 50
	}

	// Determine granularity.
	granularity := "yearly"
	if yearsAhead <= 2 {
		granularity = "monthly"
	}

	// Fetch rules and portfolio state (same setup as Compute).
	rules, err := s.dp.ProjectionStore.ListRulesByScenario(ctx, scenarioID)
	if err != nil {
		return model.ChartResult{}, err
	}

	portfolio, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, portfolioID, uuid.Nil)
	if err != nil {
		return model.ChartResult{}, err
	}

	assets, err := s.dp.AssetStore.ListAssetsByPortfolio(ctx, portfolioID, model.ListAssetsFilter{})
	if err != nil {
		return model.ChartResult{}, err
	}
	debts, err := s.dp.DebtStore.ListDebtsByPortfolio(ctx, portfolioID, model.ListDebtsFilter{})
	if err != nil {
		return model.ChartResult{}, err
	}

	var startAssets, startDebts float64
	for _, a := range assets {
		startAssets += a.CurrentPrice * a.Quantity * (a.OwnershipPct / 100)
	}
	for _, d := range debts {
		startDebts += d.Balance * (d.OwnershipPct / 100)
	}
	startAssets = round2(startAssets)
	startDebts = round2(startDebts)

	var activeRules []model.ProjectionRule
	for _, r := range rules {
		if r.IsActive {
			activeRules = append(activeRules, r)
		}
	}

	inflationRateMonthly := 0.0
	for _, r := range activeRules {
		if r.RuleType == model.RuleInflationRate {
			inflationRateMonthly = cfloat(r.Config, "percentage") / 100 / 12
		}
	}

	now := time.Now().UTC()
	assetsVal := startAssets
	debtsVal := startDebts
	inflationFactor := 1.0
	maxMonths := yearsAhead * 12

	labelFor := func(month int, date time.Time) string {
		if granularity == "monthly" {
			return date.Format("Jan 2006")
		}
		return fmt.Sprintf("%d", date.Year())
	}

	// Include month 0 (starting point).
	points := []model.ChartPoint{{
		Label:    labelFor(0, now),
		Month:    0,
		Year:     now.Year(),
		NetWorth: round2(startAssets - startDebts),
		Assets:   startAssets,
		Debts:    startDebts,
	}}

	for month := 1; month <= maxMonths; month++ {
		currentDate := now.AddDate(0, month, 0)
		inflationFactor *= (1 + inflationRateMonthly)

		for _, r := range activeRules {
			c := r.Config
			switch r.RuleType {
			case model.RulePortfolioGrowth:
				assetsVal += assetsVal * (cfloat(c, "percentage") / 100 / cfreq(c, "frequency"))
			case model.RuleAssetTypeGrowth:
				assetsVal += assetsVal * (cfloat(c, "percentage") / 100 / cfreq(c, "frequency"))
			case model.RuleAssetGrowth:
				assetsVal += assetsVal * (cfloat(c, "percentage") / 100 / cfreq(c, "frequency"))
			case model.RuleAssetTargetValue:
				targetVal := cfloat(c, "target_value")
				byYear := int(cfloat(c, "by_year"))
				if month == (byYear-now.Year())*12 && targetVal > 0 {
					assetsVal = math.Max(assetsVal, targetVal)
				}
			case model.RuleDebtInterest:
				debtsVal += debtsVal * (cfloat(c, "percentage") / 100 / 12)
			case model.RuleDebtPayment:
				start := ctime(c, "start_date")
				if start.IsZero() || !currentDate.Before(start) {
					debtsVal = math.Max(0, debtsVal-cfloat(c, "amount")/cfreq(c, "frequency"))
				}
			case model.RuleDebtAccelerated:
				debtsVal = math.Max(0, debtsVal-debtsVal*(cfloat(c, "percentage")/100/12))
			case model.RuleDebtFreeGoal:
				if month >= int(cfloat(c, "months")) {
					debtsVal = 0
				}
			case model.RuleEmploymentIncome:
				untilYear := int(cfloat(c, "until_year"))
				if untilYear == 0 || currentDate.Year() <= untilYear {
					yearsIn := float64(currentDate.Year() - now.Year())
					growth := math.Pow(1+cfloat(c, "annual_increase_pct")/100, yearsIn)
					assetsVal += (cfloat(c, "amount") * growth) / cfreq(c, "frequency")
				}
			case model.RuleAssetIncome:
				assetsVal += cfloat(c, "amount") / cfreq(c, "frequency")
			case model.RuleOneTimeIncome:
				if d := ctime(c, "date"); !d.IsZero() && month == monthsBetween(now, d) {
					assetsVal += cfloat(c, "amount")
				}
			case model.RuleFutureIncome:
				if sd := ctime(c, "start_date"); !sd.IsZero() && !currentDate.Before(sd) {
					assetsVal += cfloat(c, "amount") / cfreq(c, "frequency")
				}
			case model.RuleRegularExpense:
				assetsVal = math.Max(0, assetsVal-(cfloat(c, "amount")*inflationFactor)/cfreq(c, "frequency"))
			case model.RuleAssetExpense:
				assetsVal = math.Max(0, assetsVal-(cfloat(c, "amount")*inflationFactor)/cfreq(c, "frequency"))
			case model.RuleManagementFee:
				assetsVal = math.Max(0, assetsVal-assetsVal*(cfloat(c, "percentage")/100/12))
			case model.RulePlannedPurchase:
				if d := ctime(c, "date"); !d.IsZero() && month == monthsBetween(now, d) {
					assetsVal = math.Max(0, assetsVal-cfloat(c, "amount"))
				}
			case model.RuleFutureObligation:
				if sd := ctime(c, "start_date"); !sd.IsZero() && !currentDate.Before(sd) {
					assetsVal = math.Max(0, assetsVal-(cfloat(c, "amount")*inflationFactor)/cfreq(c, "frequency"))
				}
			}
		}

		assetsVal = round2(math.Max(0, assetsVal))
		debtsVal = round2(math.Max(0, debtsVal))

		// Capture point based on granularity.
		capture := false
		if granularity == "monthly" {
			capture = true
		} else if month%12 == 0 {
			capture = true
		}

		if capture {
			points = append(points, model.ChartPoint{
				Label:    labelFor(month, currentDate),
				Month:    month,
				Year:     currentDate.Year(),
				NetWorth: round2(assetsVal - debtsVal),
				Assets:   assetsVal,
				Debts:    debtsVal,
			})
		}
	}

	return model.ChartResult{
		ScenarioID:  scenarioID,
		Granularity: granularity,
		YearsAhead:  yearsAhead,
		Currency:    string(portfolio.BaseCurrency),
		Points:      points,
	}, nil
}

// ─── Config helpers ───────────────────────────────────────────────────────────

// cfloat safely reads a float64 from a JSONB config map.
func cfloat(c model.JSONB, key string) float64 {
	if c == nil {
		return 0
	}
	switch v := c[key].(type) {
	case float64:
		return v
	case int:
		return float64(v)
	}
	return 0
}

// cfreq maps a frequency string to months-per-year for per-month math.
// Returns the number of times per year; 0 falls back to monthly (12).
func cfreq(c model.JSONB, key string) float64 {
	freq, _ := c[key].(string)
	switch freq {
	case "daily":
		return 365
	case "weekly":
		return 52
	case "biweekly":
		return 26
	case "monthly":
		return 12
	case "quarterly":
		return 4
	case "biannual":
		return 2
	case "annually":
		return 1
	}
	return 12
}

// ctime parses an RFC 3339 date string from a JSONB config map.
func ctime(c model.JSONB, key string) time.Time {
	if c == nil {
		return time.Time{}
	}
	s, _ := c[key].(string)
	if s == "" {
		return time.Time{}
	}
	t, _ := time.Parse(time.RFC3339, s)
	if t.IsZero() {
		t, _ = time.Parse("2006-01-02", s)
	}
	return t
}

// monthsBetween returns the number of whole months from `from` to `to`.
func monthsBetween(from, to time.Time) int {
	years := to.Year() - from.Year()
	months := int(to.Month()) - int(from.Month())
	return years*12 + months
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
