// Package assetclass provides the canonical catalogue of asset classes supported by Silo.
//
// There are 8 asset classes that group one or more asset types.
// SVG icons are hardcoded as constants — no file I/O, no external assets required.
// The database stores the granular asset_type; callers use ClassOf to resolve the
// parent class and its display metadata (name, description, icon).
package assetclass

import (
	"strings"

	"github.com/wearegravitylabs/silo/api/model"
)

// AssetClass carries display metadata for a group of related asset types.
type AssetClass struct {
	Code        string `json:"code"`        // e.g. "stock"
	Name        string `json:"name"`        // e.g. "Stocks"
	Description string `json:"description"` // shown in the add-asset picker
	Icon        string `json:"icon"`        // inline SVG (viewBox="0 0 24 24")
}

// ── SVG icon constants ────────────────────────────────────────────────────────
// Each icon is a 24×24 viewBox SVG using currentColor so it adapts to any
// colour context the FE applies. Strokes use stroke-linecap/linejoin="round".

const iconStock = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`

const iconCrypto = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`

const iconRealEstate = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`

const iconDomain = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`

const iconPhysical = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`

const iconVC = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`

const iconBusiness = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`

const iconManual = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`

// ── Registry ──────────────────────────────────────────────────────────────────

// registry maps asset class code → AssetClass, ordered for All().
var registryOrdered = []AssetClass{
	{
		Code: "stock",
		Name: "Stocks",
		Description: "Publicly traded stocks, ETFs, and mutual funds. " +
			"Add a ticker for automatic price tracking, or enter values manually.",
		Icon: iconStock,
	},
	{
		Code: "crypto",
		Name: "Crypto",
		Description: "Cryptocurrencies, tokens, and digital assets. " +
			"Supports automatic price sync by coin ID or manual entry.",
		Icon: iconCrypto,
	},
	{
		Code: "real_estate",
		Name: "Real Estate",
		Description: "Properties you own — primary residence, rentals, commercial. " +
			"Update valuations manually and track location on the map.",
		Icon: iconRealEstate,
	},
	{
		Code: "domain",
		Name: "Domains",
		Description: "Domain names and digital real estate. " +
			"Track acquisition cost, estimated value, and renewal dates.",
		Icon: iconDomain,
	},
	{
		Code: "physical",
		Name: "Physical Valuables",
		Description: "Gold, jewellery, art, watches, vehicles, and collectibles. " +
			"Manually enter and update valuations over time.",
		Icon: iconPhysical,
	},
	{
		Code: "vc",
		Name: "Venture Capital",
		Description: "Angel investments, startup equity, and VC fund positions. " +
			"Track total invested, distributions received, and current estimated value.",
		Icon: iconVC,
	},
	{
		Code: "business",
		Name: "Business",
		Description: "Ownership stakes in private businesses, LLCs, and partnerships. " +
			"Track your equity percentage and update the estimated business value.",
		Icon: iconBusiness,
	},
	{
		Code: "manual",
		Name: "Manual Assets",
		Description: "Anything that doesn't fit elsewhere — IP, loans you've given, " +
			"collectibles, or any custom asset. You name it, value it, track it.",
		Icon: iconManual,
	},
}

var registryByCode = func() map[string]AssetClass {
	m := make(map[string]AssetClass, len(registryOrdered))
	for _, c := range registryOrdered {
		m[c.Code] = c
	}
	return m
}()

// typeToClassCode maps every model.AssetType to its parent class code.
var typeToClassCode = map[model.AssetType]string{
	model.AssetTypeStockTicker:  "stock",
	model.AssetTypeStockManual:  "stock",
	model.AssetTypeCryptoTicker: "crypto",
	model.AssetTypeCryptoManual: "crypto",
	model.AssetTypeRealEstate:   "real_estate",
	model.AssetTypeDomain:       "domain",
	model.AssetTypePhysical:     "physical",
	model.AssetTypeVC:           "vc",
	model.AssetTypeBusiness:     "business",
	model.AssetTypeManual:       "manual",
	model.AssetTypeBank:         "manual", // bank connections shown under manual-ish
}

// typeToInvestability defines the preset investability for each asset type.
// When the second return value is false, the user must supply their own value.
var typeToInvestability = map[model.AssetType]model.Investability{
	model.AssetTypeBank:         model.InvestabilityCash,
	model.AssetTypeStockTicker:  model.InvestabilityInvestable,
	model.AssetTypeStockManual:  model.InvestabilityInvestable,
	model.AssetTypeCryptoTicker: model.InvestabilityInvestable,
	model.AssetTypeCryptoManual: model.InvestabilityInvestable, // default; stablecoins should be overridden to Cash
	model.AssetTypeRealEstate:   model.InvestabilityNonInvest,
	model.AssetTypePhysical:     model.InvestabilityNonInvest,
	model.AssetTypeVC:           model.InvestabilityNonInvest,
	model.AssetTypeBusiness:     model.InvestabilityNonInvest,
	// manual and domain are NOT in this map — user must supply
}

// ── Public API ────────────────────────────────────────────────────────────────

// All returns all 8 asset classes in display order.
func All() []AssetClass { return registryOrdered }

// Lookup returns the AssetClass for the given class code (case-insensitive).
func Lookup(code string) (AssetClass, bool) {
	c, ok := registryByCode[strings.ToLower(strings.TrimSpace(code))]
	return c, ok
}

// ClassOf returns the parent AssetClass for a given model.AssetType.
func ClassOf(t model.AssetType) AssetClass {
	code, ok := typeToClassCode[t]
	if !ok {
		return registryByCode["manual"] // safe fallback
	}
	return registryByCode[code]
}

// DefaultInvestability returns the preset investability for a given asset type.
// When the second return value is false the asset type is user-editable
// (manual and domain) and the caller must supply a value.
func DefaultInvestability(t model.AssetType) (model.Investability, bool) {
	inv, ok := typeToInvestability[t]
	return inv, ok
}

// InvestabilityEditable reports whether a user can change the investability
// for the given asset type.
func InvestabilityEditable(t model.AssetType) bool {
	_, preset := typeToInvestability[t]
	return !preset
}
