// Package currency provides the canonical list of currencies supported by Silo.
//
// Icons are hardcoded as emoji flag sequences — no external assets required.
// The database stores only the ISO 4217 code; callers resolve full details at
// the API layer using Lookup or All.
package currency

import "strings"

// Currency carries display metadata for a single currency.
type Currency struct {
	Code   string `json:"code"`   // ISO 4217 (e.g. "USD")
	Name   string `json:"name"`   // e.g. "US Dollar"
	Symbol string `json:"symbol"` // e.g. "$"
	Flag   string `json:"flag"`   // emoji flag, e.g. "🇺🇸"
}

// registry is the single source of supported currencies, keyed by uppercase ISO code.
var registry = map[string]Currency{
	// ─── Americas ────────────────────────────────────────────────────────────
	"USD": {Code: "USD", Name: "US Dollar", Symbol: "$", Flag: "🇺🇸"},
	"CAD": {Code: "CAD", Name: "Canadian Dollar", Symbol: "CA$", Flag: "🇨🇦"},
	"BRL": {Code: "BRL", Name: "Brazilian Real", Symbol: "R$", Flag: "🇧🇷"},
	"MXN": {Code: "MXN", Name: "Mexican Peso", Symbol: "MX$", Flag: "🇲🇽"},
	"ARS": {Code: "ARS", Name: "Argentine Peso", Symbol: "$", Flag: "🇦🇷"},

	// ─── Europe ──────────────────────────────────────────────────────────────
	"EUR": {Code: "EUR", Name: "Euro", Symbol: "€", Flag: "🇪🇺"},
	"GBP": {Code: "GBP", Name: "British Pound", Symbol: "£", Flag: "🇬🇧"},
	"CHF": {Code: "CHF", Name: "Swiss Franc", Symbol: "Fr", Flag: "🇨🇭"},
	"SEK": {Code: "SEK", Name: "Swedish Krona", Symbol: "kr", Flag: "🇸🇪"},
	"NOK": {Code: "NOK", Name: "Norwegian Krone", Symbol: "kr", Flag: "🇳🇴"},
	"DKK": {Code: "DKK", Name: "Danish Krone", Symbol: "kr", Flag: "🇩🇰"},

	// ─── Asia & Oceania ──────────────────────────────────────────────────────
	"JPY": {Code: "JPY", Name: "Japanese Yen", Symbol: "¥", Flag: "🇯🇵"},
	"CNY": {Code: "CNY", Name: "Chinese Yuan", Symbol: "¥", Flag: "🇨🇳"},
	"INR": {Code: "INR", Name: "Indian Rupee", Symbol: "₹", Flag: "🇮🇳"},
	"SGD": {Code: "SGD", Name: "Singapore Dollar", Symbol: "S$", Flag: "🇸🇬"},
	"HKD": {Code: "HKD", Name: "Hong Kong Dollar", Symbol: "HK$", Flag: "🇭🇰"},
	"AUD": {Code: "AUD", Name: "Australian Dollar", Symbol: "A$", Flag: "🇦🇺"},
	"NZD": {Code: "NZD", Name: "New Zealand Dollar", Symbol: "NZ$", Flag: "🇳🇿"},
	"AED": {Code: "AED", Name: "UAE Dirham", Symbol: "د.إ", Flag: "🇦🇪"},

	// ─── Africa ──────────────────────────────────────────────────────────────
	"NGN": {Code: "NGN", Name: "Nigerian Naira", Symbol: "₦", Flag: "🇳🇬"},
	"GHS": {Code: "GHS", Name: "Ghanaian Cedi", Symbol: "₵", Flag: "🇬🇭"},
	"KES": {Code: "KES", Name: "Kenyan Shilling", Symbol: "KSh", Flag: "🇰🇪"},
	"ZAR": {Code: "ZAR", Name: "South African Rand", Symbol: "R", Flag: "🇿🇦"},
	"TZS": {Code: "TZS", Name: "Tanzanian Shilling", Symbol: "TSh", Flag: "🇹🇿"},
	"UGX": {Code: "UGX", Name: "Ugandan Shilling", Symbol: "USh", Flag: "🇺🇬"},
	"RWF": {Code: "RWF", Name: "Rwandan Franc", Symbol: "RF", Flag: "🇷🇼"},
	"ZMW": {Code: "ZMW", Name: "Zambian Kwacha", Symbol: "ZK", Flag: "🇿🇲"},
	"ETB": {Code: "ETB", Name: "Ethiopian Birr", Symbol: "Br", Flag: "🇪🇹"},
	"MAD": {Code: "MAD", Name: "Moroccan Dirham", Symbol: "د.م.", Flag: "🇲🇦"},
	"EGP": {Code: "EGP", Name: "Egyptian Pound", Symbol: "E£", Flag: "🇪🇬"},
	"XOF": {Code: "XOF", Name: "West African CFA Franc", Symbol: "CFA", Flag: "🌍"},
	"XAF": {Code: "XAF", Name: "Central African CFA Franc", Symbol: "FCFA", Flag: "🌍"},
}

// Lookup returns the Currency for the given ISO code (case-insensitive).
// The second return value is false when the code is not in the supported list.
func Lookup(code string) (Currency, bool) {
	c, ok := registry[strings.ToUpper(strings.TrimSpace(code))]
	return c, ok
}

// IsValid reports whether code is a supported currency.
func IsValid(code string) bool {
	_, ok := Lookup(code)
	return ok
}

// All returns every supported currency sorted by code.
func All() []Currency {
	out := make([]Currency, 0, len(registry))
	for _, c := range registry {
		out = append(out, c)
	}
	return out
}

// MustLookup returns the Currency for code, panicking if not found.
// Use only in init or test code where the code is a compile-time constant.
func MustLookup(code string) Currency {
	c, ok := Lookup(code)
	if !ok {
		panic("currency: unsupported code " + code)
	}
	return c
}
