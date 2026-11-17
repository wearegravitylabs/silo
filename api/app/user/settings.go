package user

import (
	"regexp"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

// The settings a user can save, and what each may hold. Objects
// (notifications, security, vault) are merged one level deep, so the app
// can send just the key that changed.
//
//	theme                  "system" | "light" | "dark"
//	accent_color           any CSS colour, up to 64 characters
//	language               a language tag like "en" or "en-NG"
//	projections_intro_seen true | false
//	notifications          { email: bool, in_app: bool }
//	security               { viewers_must_sign_up: bool }
//	vault                  { auto_lock_minutes: whole number 0–1440 }
var (
	languageTag = regexp.MustCompile(`^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$`)
	objectKeys  = map[string]map[string]func(any) bool{
		"notifications": {"email": isBool, "in_app": isBool},
		"security":      {"viewers_must_sign_up": isBool},
		"vault":         {"auto_lock_minutes": wholeNumber(0, 1440)},
	}
	plainKeys = map[string]func(any) bool{
		"theme":                  oneOf("system", "light", "dark"),
		"accent_color":           shortString(64),
		"language":               func(v any) bool { s, ok := v.(string); return ok && languageTag.MatchString(s) },
		"projections_intro_seen": isBool,
	}
)

// mergeSettings applies a settings patch to the saved settings: keys sent
// replace those keys, a key sent as null is removed, others are kept.
func mergeSettings(saved, patch model.JSONB) (model.JSONB, error) {
	out := model.JSONB{}
	for k, v := range saved {
		out[k] = v
	}
	for k, v := range patch {
		if v == nil {
			delete(out, k)
			continue
		}
		if check, ok := plainKeys[k]; ok {
			if !check(v) {
				return nil, siloErrors.ErrInvalidSettings
			}
			out[k] = v
			continue
		}
		fields, ok := objectKeys[k]
		if !ok {
			return nil, siloErrors.ErrInvalidSettings
		}
		sent, ok := v.(map[string]any)
		if !ok {
			return nil, siloErrors.ErrInvalidSettings
		}
		merged := map[string]any{}
		if old, ok := out[k].(map[string]any); ok {
			for fk, fv := range old {
				merged[fk] = fv
			}
		}
		for fk, fv := range sent {
			check, ok := fields[fk]
			if !ok {
				return nil, siloErrors.ErrInvalidSettings
			}
			if fv == nil {
				delete(merged, fk)
				continue
			}
			if !check(fv) {
				return nil, siloErrors.ErrInvalidSettings
			}
			merged[fk] = fv
		}
		out[k] = merged
	}
	return out, nil
}

func isBool(v any) bool { _, ok := v.(bool); return ok }

func oneOf(values ...string) func(any) bool {
	return func(v any) bool {
		s, ok := v.(string)
		for _, x := range values {
			if ok && s == x {
				return true
			}
		}
		return false
	}
}

func shortString(max int) func(any) bool {
	return func(v any) bool { s, ok := v.(string); return ok && s != "" && len(s) <= max }
}

func wholeNumber(min, max float64) func(any) bool {
	return func(v any) bool {
		f, ok := v.(float64)
		return ok && f == float64(int(f)) && f >= min && f <= max
	}
}
