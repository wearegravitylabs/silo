// Package physicalsubtype provides the catalogue of physical asset sub-categories.
//
// SVG icons are stubs — paste in the actual design-system SVGs to complete them,
// following the same pattern used in pkg/assetclass.
package physicalsubtype

import "strings"

// Code is the machine-readable physical subtype identifier (e.g. "vehicle", "watch").
// It is a type alias for string so GORM and JSON serialisation work transparently.
type Code = string

// PhysicalSubtype carries display metadata for a physical asset sub-category.
type PhysicalSubtype struct {
	Code Code   `json:"code"`
	Name string `json:"name"`
	Icon string `json:"icon"` // inline SVG — design-system asset
}

// registry is the ordered list of supported physical subtypes.
var registry = []PhysicalSubtype{
	{
		Code: "vehicle",
		Name: "Vehicle",
		Icon: ``,  // paste SVG here
	},
	{
		Code: "gold_precious_metals",
		Name: "Gold & Precious Metals",
		Icon: ``,
	},
	{
		Code: "jewelry",
		Name: "Jewellery",
		Icon: ``,
	},
	{
		Code: "art",
		Name: "Art",
		Icon: ``,
	},
	{
		Code: "watch",
		Name: "Watch",
		Icon: ``,
	},
	{
		Code: "collectible",
		Name: "Collectible",
		Icon: ``,
	},
	{
		Code: "other",
		Name: "Other",
		Icon: ``,
	},
}

var registryByCode = func() map[string]PhysicalSubtype {
	m := make(map[string]PhysicalSubtype, len(registry))
	for _, s := range registry {
		m[s.Code] = s
	}
	return m
}()

// All returns every supported physical subtype in display order.
func All() []PhysicalSubtype { return registry }

// Lookup returns the PhysicalSubtype for the given code (case-insensitive).
func Lookup(code string) (PhysicalSubtype, bool) {
	s, ok := registryByCode[strings.ToLower(strings.TrimSpace(code))]
	return s, ok
}

// IsValid reports whether code is a supported physical subtype.
func IsValid(code string) bool {
	_, ok := Lookup(code)
	return ok
}
