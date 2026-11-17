package projection

import (
	"math"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/model"
)

var start = time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC)

func rule(t model.ProjectionRuleType, c model.JSONB) model.ProjectionRule {
	return model.ProjectionRule{RuleType: t, IsActive: true, Config: c}
}

func run(t *testing.T, in engineInput) []monthState {
	t.Helper()
	if in.Start.IsZero() {
		in.Start = start
	}
	states, _ := runEngine(in)
	return states
}

func near(t *testing.T, name string, got, want float64) {
	t.Helper()
	if math.Abs(got-want) > 0.01 {
		t.Errorf("%s = %.4f, want %.4f", name, got, want)
	}
}

var (
	house = uuid.MustParse("00000000-0000-4000-8000-000000000001")
	fund  = uuid.MustParse("00000000-0000-4000-8000-000000000002")
	loanA = uuid.MustParse("00000000-0000-4000-8000-000000000003")
	loanB = uuid.MustParse("00000000-0000-4000-8000-000000000004")
)

func twoAssets() []engineAsset {
	return []engineAsset{
		{ID: house, Type: model.AssetTypeRealEstate, Category: CategoryNonInvestable, Value: 100000},
		{ID: fund, Type: model.AssetTypeStockManual, Category: CategoryStocks, Value: 50000},
	}
}

// "6% annually" is 6% over a year, not 6% a month.
func TestYearlyRateCompoundsOverTheYear(t *testing.T) {
	s := run(t, engineInput{
		Assets: []engineAsset{{ID: house, Value: 100000}},
		Rules:  []model.ProjectionRule{rule(model.RulePortfolioGrowth, model.JSONB{"percentage": 6.0, "frequency": "annually"})},
		Months: 24,
	})
	near(t, "after 12 months", s[12].Assets, 106000)
	near(t, "after 24 months", s[24].Assets, 112360)
}

func TestMonthlyRate(t *testing.T) {
	s := run(t, engineInput{
		Assets: []engineAsset{{ID: house, Value: 1000}},
		Rules:  []model.ProjectionRule{rule(model.RulePortfolioGrowth, model.JSONB{"percentage": 1.0, "frequency": "monthly"})},
		Months: 12,
	})
	near(t, "1% a month for 12 months", s[12].Assets, 1000*math.Pow(1.01, 12))
}

// "$60k annually" is $5k a month; "$500 monthly" is $500 a month.
func TestAmountsAreSpreadByFrequency(t *testing.T) {
	s := run(t, engineInput{
		Rules: []model.ProjectionRule{
			rule(model.RuleEmploymentIncome, model.JSONB{"amount": 60000.0, "frequency": "annually"}),
			rule(model.RuleRegularExpense, model.JSONB{"amount": 500.0, "frequency": "monthly"}),
		},
		Months: 12,
	})
	near(t, "cash after 1 month", s[1].Cash, 5000-500)
	near(t, "cash after 12 months", s[12].Cash, 60000-6000)
	near(t, "income after 12 months", s[12].Income, 60000)
	near(t, "expenses after 12 months", s[12].Expenses, 6000)
}

// The most specific growth rule wins; others don't stack.
func TestMostSpecificGrowthWins(t *testing.T) {
	s := run(t, engineInput{
		Assets: twoAssets(),
		Rules: []model.ProjectionRule{
			rule(model.RulePortfolioGrowth, model.JSONB{"percentage": 6.0, "frequency": "annually"}),
			rule(model.RuleAssetTypeGrowth, model.JSONB{"asset_type": "real_estate", "percentage": 3.0, "frequency": "annually"}),
		},
		Months: 12,
	})
	// house 3%, fund 6% (portfolio-wide).
	near(t, "assets after a year", s[12].Assets, 103000+53000)
}

func TestAssetGrowthOnlyTouchesThatAsset(t *testing.T) {
	s := run(t, engineInput{
		Assets: twoAssets(),
		Rules:  []model.ProjectionRule{rule(model.RuleAssetGrowth, model.JSONB{"asset_id": fund.String(), "percentage": 10.0, "frequency": "annually"})},
		Months: 12,
	})
	near(t, "assets after a year", s[12].Assets, 100000+55000)
}

func TestCategoryGrowth(t *testing.T) {
	s := run(t, engineInput{
		Assets: twoAssets(),
		Debts:  []engineDebt{{ID: loanA, Balance: 10000}},
		Rules: []model.ProjectionRule{
			rule(model.RuleValueChange, model.JSONB{"target": "stocks", "percentage": 5.0}),
			rule(model.RuleValueChange, model.JSONB{"target": "non_investable_assets", "percentage": 7.0}),
			rule(model.RuleValueChange, model.JSONB{"target": "debts", "percentage": -2.0}),
		},
		Months: 12,
	})
	near(t, "assets after a year", s[12].Assets, 107000+52500)
	near(t, "debts after a year", s[12].Debts, 9800)
}

func TestDebtInterestOnOneDebt(t *testing.T) {
	s := run(t, engineInput{
		Debts:  []engineDebt{{ID: loanA, Balance: 1000}, {ID: loanB, Balance: 1000}},
		Rules:  []model.ProjectionRule{rule(model.RuleDebtInterest, model.JSONB{"percentage": 10.0, "debt_id": loanA.String()})},
		Months: 12,
	})
	near(t, "debts after a year", s[12].Debts, 1100+1000)
}

func TestManagementFeeOnOneAsset(t *testing.T) {
	s := run(t, engineInput{
		Assets: twoAssets(),
		Rules:  []model.ProjectionRule{rule(model.RuleManagementFee, model.JSONB{"percentage": 12.0, "scope": fund.String()})},
		Months: 1,
	})
	// 1% of the fund's 50,000 in the first month; the house is untouched.
	near(t, "assets after a month", s[1].Assets, 100000+49500)
	near(t, "fee counted as an expense", s[1].Expenses, 500)
}

// Debt payments come out of cash.
func TestDebtPaymentFromCash(t *testing.T) {
	s := run(t, engineInput{
		Debts:  []engineDebt{{ID: loanA, Balance: 10000}},
		Rules:  []model.ProjectionRule{rule(model.RuleDebtPayment, model.JSONB{"amount": 500.0, "frequency": "monthly"})},
		Months: 24,
	})
	near(t, "debt after a year", s[12].Debts, 4000)
	near(t, "cash after a year", s[12].Cash, -6000)
	// Paid off in month 20; nothing more is taken after that.
	near(t, "debt after two years", s[24].Debts, 0)
	near(t, "cash after two years", s[24].Cash, -10000)
}

func TestDebtPaymentStartsOnItsDate(t *testing.T) {
	s := run(t, engineInput{
		Debts:  []engineDebt{{ID: loanA, Balance: 10000}},
		Rules:  []model.ProjectionRule{rule(model.RuleDebtPayment, model.JSONB{"amount": 1000.0, "frequency": "monthly", "start_date": "2026-07-01"})},
		Months: 12,
	})
	// Months 6..12 (Jul 15 … Jan 15) pay: 7 payments.
	near(t, "debt after a year", s[12].Debts, 3000)
}

// A debt-free goal pays down evenly instead of dropping to 0 at the end.
func TestDebtFreeGoalIsGradual(t *testing.T) {
	s := run(t, engineInput{
		Debts:  []engineDebt{{ID: loanA, Balance: 10000}},
		Rules:  []model.ProjectionRule{rule(model.RuleDebtFreeGoal, model.JSONB{"months": 10.0})},
		Months: 12,
	})
	near(t, "debt after 5 months", s[5].Debts, 5000)
	near(t, "debt after 10 months", s[10].Debts, 0)
	near(t, "paid from cash", s[10].Cash, -10000)
}

// A target value is approached month by month, not jumped to.
func TestTargetValueIsGradual(t *testing.T) {
	// From Jan 2026 to Dec 2027 is 23 months.
	s := run(t, engineInput{
		Assets: []engineAsset{{ID: house, Value: 100000}},
		Rules:  []model.ProjectionRule{rule(model.RuleAssetTargetValue, model.JSONB{"asset_id": house.String(), "target_value": 200000.0, "by_year": 2027.0})},
		Months: 30,
	})
	near(t, "halfway (geometric)", s[23].Assets, 200000)
	if s[12].Assets <= 100000 || s[12].Assets >= 200000 {
		t.Errorf("after a year the house should be between start and target, got %.2f", s[12].Assets)
	}
	near(t, "flat after the target with no other growth rule", s[30].Assets, 200000)
}

// Expenses rise with inflation; assets don't.
func TestInflationRaisesExpensesOnly(t *testing.T) {
	s := run(t, engineInput{
		Assets: []engineAsset{{ID: house, Value: 1000}},
		Rules: []model.ProjectionRule{
			rule(model.RuleInflationRate, model.JSONB{"percentage": 12.0}),
			rule(model.RuleRegularExpense, model.JSONB{"amount": 100.0, "frequency": "monthly"}),
		},
		Months: 12,
	})
	near(t, "house unchanged", s[12].Assets, 1000)
	near(t, "expense in month 12", s[12].Expenses-s[11].Expenses, 112)
}

func TestIncomeUntilAge(t *testing.T) {
	born := time.Date(1966, 7, 1, 0, 0, 0, 0, time.UTC) // turns 60 on 2026-07-01
	in := engineInput{
		Rules:     []model.ProjectionRule{rule(model.RuleEmploymentIncome, model.JSONB{"amount": 1000.0, "frequency": "monthly", "age": 60.0})},
		Months:    12,
		BirthDate: &born,
	}
	s := run(t, in)
	// Paid for Feb 15 … Jun 15 (months 1-5), not from Jul 15.
	near(t, "income stops at 60", s[12].Income, 5000)

	in.BirthDate = nil
	in.Start = start
	_, warnings := runEngine(in)
	if len(warnings) != 1 || warnings[0] != WarnDateOfBirthMissing {
		t.Errorf("no date of birth: warnings = %v", warnings)
	}
}

func TestEmploymentRaiseIsYearly(t *testing.T) {
	s := run(t, engineInput{
		Rules:  []model.ProjectionRule{rule(model.RuleEmploymentIncome, model.JSONB{"amount": 1000.0, "frequency": "monthly", "annual_increase_pct": 10.0})},
		Months: 13,
	})
	near(t, "month 12 still the old salary", s[12].Income-s[11].Income, 1000)
	near(t, "month 13 has the raise", s[13].Income-s[12].Income, 1100)
}

func TestOneTimeEvents(t *testing.T) {
	s := run(t, engineInput{
		Rules: []model.ProjectionRule{
			rule(model.RuleOneTimeIncome, model.JSONB{"amount": 5000.0, "date": "2026-04-10"}),
			rule(model.RulePlannedPurchase, model.JSONB{"amount": 2000.0, "date": "2026-06-01"}),
		},
		Months: 12,
	})
	near(t, "before", s[2].Cash, 0)
	near(t, "after the bonus", s[3].Cash, 5000)
	near(t, "after the purchase", s[5].Cash, 3000)
}

func TestValidateRule(t *testing.T) {
	ok := []model.ProjectionRule{
		rule(model.RuleValueChange, model.JSONB{"target": "debts", "percentage": -2.0}),
		rule(model.RuleAssetTypeGrowth, model.JSONB{"asset_type": "real_estate", "percentage": "3", "frequency": "annually"}),
		rule(model.RuleOneTimeIncome, model.JSONB{"amount": 10.0, "date": "2027-01-01"}),
	}
	for _, r := range ok {
		if err := validateRule(r.RuleType, r.Config); err != nil {
			t.Errorf("%s %v: unexpected error %v", r.RuleType, r.Config, err)
		}
	}
	bad := []model.ProjectionRule{
		rule("made_up", model.JSONB{}),
		rule(model.RuleValueChange, model.JSONB{"target": "cars", "percentage": 2.0}),
		rule(model.RuleAssetGrowth, model.JSONB{"asset_id": "nope", "percentage": 2.0}),
		rule(model.RuleOneTimeIncome, model.JSONB{"amount": 10.0}),
		rule(model.RulePortfolioGrowth, model.JSONB{"percentage": 6.0, "frequency": "fortnightly"}),
	}
	for _, r := range bad {
		if err := validateRule(r.RuleType, r.Config); err == nil {
			t.Errorf("%s %v: want an error", r.RuleType, r.Config)
		}
	}
}
