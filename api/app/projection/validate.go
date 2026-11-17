package projection

import (
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

// ruleNeeds lists, per rule type, the config keys it can't work without.
// Keys ending in "_id" must be ids; date keys YYYY-MM-DD or RFC 3339; the
// rest numbers (or numeric strings).
var ruleNeeds = map[model.ProjectionRuleType][]string{
	model.RuleValueChange:      {"target", "percentage"},
	model.RulePortfolioGrowth:  {"percentage"},
	model.RuleAssetTypeGrowth:  {"asset_type", "percentage"},
	model.RuleAssetGrowth:      {"asset_id", "percentage"},
	model.RuleAssetTargetValue: {"asset_id", "target_value", "by_year"},
	model.RuleDebtInterest:     {"percentage"},
	model.RuleDebtPayment:      {"amount"},
	model.RuleDebtAccelerated:  {"percentage"},
	model.RuleDebtFreeGoal:     {"months"},
	model.RuleEmploymentIncome: {"amount"},
	model.RuleAssetIncome:      {"amount"},
	model.RuleOneTimeIncome:    {"amount", "date"},
	model.RuleFutureIncome:     {"amount", "start_date"},
	model.RuleRegularExpense:   {"amount"},
	model.RuleAssetExpense:     {"amount"},
	model.RuleManagementFee:    {"percentage"},
	model.RulePlannedPurchase:  {"amount", "date"},
	model.RuleFutureObligation: {"amount", "start_date"},
	model.RuleInflationRate:    {"percentage"},
}

var categories = map[string]bool{
	CategoryInvestable: true, CategoryStocks: true, CategoryNonInvestable: true, CategoryDebts: true,
}

// validateRule checks a rule's type and that its config has what the engine
// needs. A bad rule would otherwise be saved and silently do nothing.
func validateRule(t model.ProjectionRuleType, c model.JSONB) error {
	needs, ok := ruleNeeds[t]
	if !ok {
		return siloErrors.ErrInvalidRuleConfig
	}
	for _, key := range needs {
		v, present := c[key]
		if !present || v == nil {
			return siloErrors.ErrInvalidRuleConfig
		}
		switch key {
		case "target":
			if !categories[cstring(c, key)] {
				return siloErrors.ErrInvalidRuleConfig
			}
		case "asset_type":
			if len(cstrings(c, key)) == 0 {
				return siloErrors.ErrInvalidRuleConfig
			}
		case "asset_id":
			if _, ok := cuuid(c, key); !ok {
				return siloErrors.ErrInvalidRuleConfig
			}
		case "date", "start_date":
			if ctime(c, key).IsZero() {
				return siloErrors.ErrInvalidRuleConfig
			}
		default:
			if _, isNum := v.(float64); !isNum && cfloat(c, key) == 0 && cstring(c, key) != "0" {
				return siloErrors.ErrInvalidRuleConfig
			}
		}
	}
	if f := cstring(c, "frequency"); f != "" && periodsPerYear(f) == 0 {
		return siloErrors.ErrInvalidRuleConfig
	}
	return nil
}
