package user

import (
	"testing"

	"github.com/wearegravitylabs/silo/api/model"
)

func TestMergeSettings(t *testing.T) {
	saved := model.JSONB{"theme": "dark", "notifications": map[string]any{"email": true, "in_app": true}}
	got, err := mergeSettings(saved, model.JSONB{"notifications": map[string]any{"email": false}, "language": "en-NG"})
	if err != nil {
		t.Fatal(err)
	}
	n := got["notifications"].(map[string]any)
	if n["email"] != false || n["in_app"] != true || got["theme"] != "dark" || got["language"] != "en-NG" {
		t.Errorf("merge = %v", got)
	}
	got, _ = mergeSettings(got, model.JSONB{"theme": nil})
	if _, ok := got["theme"]; ok {
		t.Errorf("theme: null should remove it, got %v", got)
	}

	bad := []model.JSONB{
		{"theme": "blue"},
		{"made_up": true},
		{"notifications": map[string]any{"sms": true}},
		{"notifications": true},
		{"vault": map[string]any{"auto_lock_minutes": 2.5}},
		{"language": "english please"},
		{"projections_intro_seen": "yes"},
	}
	for _, p := range bad {
		if _, err := mergeSettings(nil, p); err == nil {
			t.Errorf("%v: want an error", p)
		}
	}
}
