package projection

import (
	"math"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/model"
)

// The projection engine: a month-by-month simulation of a portfolio under a
// scenario's rules. It is pure (no database, no clock) so it can be tested
// with numbers worked out by hand; Compute and Chart both run it.
//
// What it tracks, all as owned shares in the portfolio's base currency:
//   - every asset's value, grown by the most specific growth rule that covers it
//     (asset > asset type > category > portfolio-wide);
//   - every debt's balance, changed only by debt rules;
//   - cash, which starts at 0: income goes in, expenses and debt payments come
//     out, and it may go below 0.
//
// Rates are per their frequency and compound: "6% annually" is ×1.06 over a
// year (×1.06^(1/12) a month), "1% monthly" is ×1.01 a month. Amounts are
// spread evenly: "$60,000 annually" is $5,000 a month, "$500 monthly" $500.
// Inflation raises expenses only.

// Projection categories, as the app names them.
const (
	CategoryInvestable    = "investable_assets"
	CategoryStocks        = "stocks"
	CategoryNonInvestable = "non_investable_assets"
	CategoryDebts         = "debts"
)

// Warnings the engine can return.
const (
	WarnDateOfBirthMissing = "date_of_birth_missing" // an "until age" rule needs the user's date of birth
)

type engineAsset struct {
	ID       uuid.UUID
	Type     model.AssetType
	Category string
	Value    float64
}

type engineDebt struct {
	ID      uuid.UUID
	Balance float64
}

type engineInput struct {
	Assets []engineAsset
	Debts  []engineDebt
	Rules  []model.ProjectionRule // active rules only
	Start  time.Time              // "today"; month m is Start + m months
	Months int
	// BirthDate is the user's date of birth, for "until age" income. Optional.
	BirthDate *time.Time
}

// monthState is the portfolio at the end of one month.
type monthState struct {
	Month    int
	Date     time.Time
	Assets   float64
	Debts    float64
	Cash     float64
	Income   float64 // cumulative since the start
	Expenses float64 // cumulative since the start
}

// assetCategory puts an asset in one of the app's three asset categories.
func assetCategory(a model.Asset) string {
	switch {
	case a.AssetClass == "stock":
		return CategoryStocks
	case a.Investability == model.InvestabilityNonInvest:
		return CategoryNonInvestable
	default:
		return CategoryInvestable
	}
}

func runEngine(in engineInput) ([]monthState, []string) {
	assets := make([]engineAsset, len(in.Assets))
	copy(assets, in.Assets)
	debts := make([]engineDebt, len(in.Debts))
	copy(debts, in.Debts)

	r := indexRules(in.Rules)
	var warnings []string
	warn := func(w string) {
		for _, x := range warnings {
			if x == w {
				return
			}
		}
		warnings = append(warnings, w)
	}

	// Asset targets: reach a value by the end of a year, from today's value.
	targets := map[uuid.UUID]*target{}
	for _, rule := range r.byType[model.RuleAssetTargetValue] {
		id, ok := cuuid(rule.Config, "asset_id")
		value := cfloat(rule.Config, "target_value")
		year := int(cfloat(rule.Config, "by_year"))
		months := monthsUntil(in.Start, time.Date(year, 12, 1, 0, 0, 0, 0, time.UTC))
		if !ok || value <= 0 || months <= 0 {
			continue
		}
		for _, a := range assets {
			if a.ID == id {
				targets[id] = newTarget(a.Value, value, months)
			}
		}
	}

	states := []monthState{{Month: 0, Date: in.Start, Assets: sumAssets(assets), Debts: sumDebts(debts)}}
	var cash, income, expenses float64

	for m := 1; m <= in.Months; m++ {
		date := in.Start.AddDate(0, m, 0)
		inflation := math.Pow(1+r.inflation/100, float64(m)/12)

		// 1. Asset growth (a target, else the most specific growth rule).
		for i := range assets {
			a := &assets[i]
			if t := targets[a.ID]; t != nil && m <= t.months {
				a.Value = t.step(a.Value)
				continue
			}
			a.Value *= r.assetFactor(*a)
		}

		// 2. Management fees come off the assets they are charged on.
		for _, rule := range r.byType[model.RuleManagementFee] {
			monthly := cfloat(rule.Config, "percentage") / 100 / 12
			scope, _ := rule.Config["scope"].(string)
			id, oneAsset := cuuid(rule.Config, "scope")
			for i := range assets {
				if scope != "" && scope != "portfolio" && (!oneAsset || assets[i].ID != id) {
					continue
				}
				fee := assets[i].Value * monthly
				assets[i].Value -= fee
				expenses += fee
			}
		}

		// 3. Debts change (interest, or a "debts change by X%" rule).
		for i := range debts {
			debts[i].Balance *= r.debtFactor(debts[i].ID)
		}

		// 4. Income in, expenses out (expenses rise with inflation).
		for _, rule := range r.income {
			if amt := incomeThisMonth(rule, in, m, date, warn); amt != 0 {
				cash += amt
				income += amt
			}
		}
		for _, rule := range r.spending {
			if amt := expenseThisMonth(rule, in.Start, m, date, inflation); amt != 0 {
				cash -= amt
				expenses += amt
			}
		}

		// 5. Debt payments, paid from cash.
		for _, rule := range r.byType[model.RuleDebtPayment] {
			if start := ctime(rule.Config, "start_date"); !start.IsZero() && date.Before(start) {
				continue
			}
			amt := perMonth(cfloat(rule.Config, "amount"), cstring(rule.Config, "frequency"), "monthly")
			if id, ok := cuuid(rule.Config, "debt_id"); ok {
				cash -= payDebt(debts, id, amt)
			} else {
				cash -= payDebts(debts, amt)
			}
		}
		for _, rule := range r.byType[model.RuleDebtAccelerated] {
			amt := sumDebts(debts) * cfloat(rule.Config, "percentage") / 100 / 12
			cash -= payDebts(debts, amt)
		}
		for _, rule := range r.byType[model.RuleDebtFreeGoal] {
			// Even payments that clear what is left by the goal month.
			goal := int(cfloat(rule.Config, "months"))
			if goal > 0 && m <= goal {
				cash -= payDebts(debts, sumDebts(debts)/float64(goal-m+1))
			}
		}

		states = append(states, monthState{
			Month: m, Date: date,
			Assets: sumAssets(assets), Debts: sumDebts(debts), Cash: cash,
			Income: income, Expenses: expenses,
		})
	}
	return states, warnings
}

// ─── Rules, indexed for the monthly loop ─────────────────────────────────────

type ruleIndex struct {
	byType    map[model.ProjectionRuleType][]model.ProjectionRule
	inflation float64 // yearly %
	income    []model.ProjectionRule
	spending  []model.ProjectionRule

	// Monthly growth factors, most specific first.
	assetRate    map[uuid.UUID]float64
	typeRate     map[model.AssetType]float64
	categoryRate map[string]float64
	portfolio    *float64
	debtRate     map[uuid.UUID]float64
	allDebtRate  *float64
}

func indexRules(rules []model.ProjectionRule) ruleIndex {
	r := ruleIndex{
		byType:       map[model.ProjectionRuleType][]model.ProjectionRule{},
		assetRate:    map[uuid.UUID]float64{},
		typeRate:     map[model.AssetType]float64{},
		categoryRate: map[string]float64{},
		debtRate:     map[uuid.UUID]float64{},
	}
	for _, rule := range rules {
		c := rule.Config
		r.byType[rule.RuleType] = append(r.byType[rule.RuleType], rule)
		growth := func() float64 {
			return monthlyFactor(cfloat(c, "percentage"), cstring(c, "frequency"))
		}
		switch rule.RuleType {
		case model.RuleInflationRate:
			r.inflation = cfloat(c, "percentage")
		case model.RulePortfolioGrowth:
			f := growth()
			r.portfolio = &f
		case model.RuleValueChange:
			target := cstring(c, "target")
			f := monthlyFactor(cfloat(c, "percentage"), "annually")
			if target == CategoryDebts {
				r.allDebtRateIfUnset(f, false)
			} else {
				r.categoryRate[target] = f
			}
		case model.RuleAssetTypeGrowth:
			for _, t := range cstrings(c, "asset_type") {
				r.typeRate[normalizeAssetType(t)] = growth()
			}
		case model.RuleAssetGrowth:
			if id, ok := cuuid(c, "asset_id"); ok {
				r.assetRate[id] = growth()
			}
		case model.RuleDebtInterest:
			f := monthlyFactor(cfloat(c, "percentage"), "annually")
			if id, ok := cuuid(c, "debt_id"); ok {
				r.debtRate[id] = f
			} else {
				r.allDebtRateIfUnset(f, true)
			}
		case model.RuleEmploymentIncome, model.RuleAssetIncome, model.RuleOneTimeIncome, model.RuleFutureIncome:
			r.income = append(r.income, rule)
		case model.RuleRegularExpense, model.RuleAssetExpense, model.RulePlannedPurchase, model.RuleFutureObligation:
			r.spending = append(r.spending, rule)
		}
	}
	return r
}

// allDebtRateIfUnset sets the rate for all debts. Interest on all debts beats
// a "debts change by X%" category rule.
func (r *ruleIndex) allDebtRateIfUnset(f float64, isInterest bool) {
	if r.allDebtRate == nil || isInterest {
		r.allDebtRate = &f
	}
}

func (r ruleIndex) assetFactor(a engineAsset) float64 {
	if f, ok := r.assetRate[a.ID]; ok {
		return f
	}
	if f, ok := r.typeRate[a.Type]; ok {
		return f
	}
	if f, ok := r.categoryRate[a.Category]; ok {
		return f
	}
	if r.portfolio != nil {
		return *r.portfolio
	}
	return 1
}

func (r ruleIndex) debtFactor(id uuid.UUID) float64 {
	if f, ok := r.debtRate[id]; ok {
		return f
	}
	if r.allDebtRate != nil {
		return *r.allDebtRate
	}
	return 1
}

// ─── Income and spending ─────────────────────────────────────────────────────

func incomeThisMonth(rule model.ProjectionRule, in engineInput, m int, date time.Time, warn func(string)) float64 {
	c := rule.Config
	switch rule.RuleType {
	case model.RuleEmploymentIncome:
		if until := int(cfloat(c, "until_year")); until > 0 && date.Year() > until {
			return 0
		}
		if age := int(cfloat(c, "age")); age > 0 {
			if in.BirthDate == nil {
				warn(WarnDateOfBirthMissing)
			} else if !date.Before(in.BirthDate.AddDate(age, 0, 0)) {
				return 0
			}
		}
		// The raise applies once a year, from 12 months on.
		raise := math.Pow(1+cfloat(c, "annual_increase_pct")/100, float64((m-1)/12))
		return perMonth(cfloat(c, "amount"), cstring(c, "frequency"), "monthly") * raise
	case model.RuleAssetIncome:
		return perMonth(cfloat(c, "amount"), cstring(c, "frequency"), "monthly")
	case model.RuleFutureIncome:
		if start := ctime(c, "start_date"); start.IsZero() || date.Before(start) {
			return 0
		}
		return perMonth(cfloat(c, "amount"), cstring(c, "frequency"), "monthly")
	case model.RuleOneTimeIncome:
		if monthsUntil(in.Start, ctime(c, "date")) == m {
			return cfloat(c, "amount")
		}
	}
	return 0
}

func expenseThisMonth(rule model.ProjectionRule, start time.Time, m int, date time.Time, inflation float64) float64 {
	c := rule.Config
	switch rule.RuleType {
	case model.RuleRegularExpense, model.RuleAssetExpense:
		return perMonth(cfloat(c, "amount"), cstring(c, "frequency"), "monthly") * inflation
	case model.RuleFutureObligation:
		if s := ctime(c, "start_date"); s.IsZero() || date.Before(s) {
			return 0
		}
		return perMonth(cfloat(c, "amount"), cstring(c, "frequency"), "monthly") * inflation
	case model.RulePlannedPurchase:
		if monthsUntil(start, ctime(c, "date")) == m {
			return cfloat(c, "amount")
		}
	}
	return 0
}

// ─── Debt payments ───────────────────────────────────────────────────────────

// payDebts pays up to amount across all debts in proportion to their balance
// and returns what was actually paid (never more than is owed).
func payDebts(debts []engineDebt, amount float64) float64 {
	total := sumDebts(debts)
	if total <= 0 || amount <= 0 {
		return 0
	}
	amount = math.Min(amount, total)
	for i := range debts {
		debts[i].Balance -= amount * debts[i].Balance / total
		if debts[i].Balance < 1e-9 {
			debts[i].Balance = 0
		}
	}
	return amount
}

// payDebt pays up to amount off one debt and returns what was paid.
func payDebt(debts []engineDebt, id uuid.UUID, amount float64) float64 {
	for i := range debts {
		if debts[i].ID == id {
			paid := math.Min(math.Max(amount, 0), debts[i].Balance)
			debts[i].Balance -= paid
			return paid
		}
	}
	return 0
}

// ─── Targets ─────────────────────────────────────────────────────────────────

// target moves an asset from its value today to a target value over a number
// of months: compounding when it starts above 0, in equal steps from 0.
type target struct {
	months int
	factor float64 // monthly growth, when start > 0
	add    float64 // monthly step, when start is 0
}

func newTarget(start, value float64, months int) *target {
	if start > 0 {
		return &target{months: months, factor: math.Pow(value/start, 1/float64(months))}
	}
	return &target{months: months, add: value / float64(months)}
}

func (t *target) step(v float64) float64 {
	if t.factor != 0 {
		return v * t.factor
	}
	return v + t.add
}

// ─── Maths helpers ───────────────────────────────────────────────────────────

// periodsPerYear is how many times a frequency happens in a year.
func periodsPerYear(freq string) float64 {
	switch strings.ToLower(freq) {
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
	case "annually", "yearly":
		return 1
	}
	return 0
}

// monthlyFactor turns "pct% per freq" into a monthly multiplier, compounding.
// A missing frequency means per year.
func monthlyFactor(pct float64, freq string) float64 {
	n := periodsPerYear(freq)
	if n == 0 {
		n = 1
	}
	return math.Pow(1+pct/100, n/12)
}

// perMonth turns "amount per freq" into a monthly amount. def is used when
// the rule has no frequency.
func perMonth(amount float64, freq, def string) float64 {
	n := periodsPerYear(freq)
	if n == 0 {
		n = periodsPerYear(def)
	}
	return amount * n / 12
}

// monthsUntil is the number of the simulated month a date falls in: 1 for
// next month, and so on. 0 or less for this month or the past.
func monthsUntil(start, date time.Time) int {
	if date.IsZero() {
		return 0
	}
	return (date.Year()-start.Year())*12 + int(date.Month()) - int(start.Month())
}

func sumAssets(assets []engineAsset) float64 {
	var t float64
	for _, a := range assets {
		t += a.Value
	}
	return t
}

func sumDebts(debts []engineDebt) float64 {
	var t float64
	for _, d := range debts {
		t += d.Balance
	}
	return t
}

// normalizeAssetType maps the app's asset-type ids to the API's.
func normalizeAssetType(t string) model.AssetType {
	if t == "venture_capital" {
		return model.AssetTypeVC
	}
	return model.AssetType(t)
}
