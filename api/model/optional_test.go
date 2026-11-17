package model

import (
	"encoding/json"
	"testing"
)

func TestOptional(t *testing.T) {
	type body struct {
		Name Optional[string] `json:"name"`
	}
	cases := []struct {
		in        string
		set       bool
		wantValue *string
	}{
		{`{}`, false, nil},
		{`{"name": null}`, true, nil},
		{`{"name": "x"}`, true, ptr("x")},
		{`{"name": ""}`, true, ptr("")},
	}
	for _, c := range cases {
		var b body
		if err := json.Unmarshal([]byte(c.in), &b); err != nil {
			t.Fatalf("%s: %v", c.in, err)
		}
		if b.Name.Set != c.set {
			t.Errorf("%s: Set = %v, want %v", c.in, b.Name.Set, c.set)
		}
		if (b.Name.Value == nil) != (c.wantValue == nil) || (c.wantValue != nil && *b.Name.Value != *c.wantValue) {
			t.Errorf("%s: Value = %v, want %v", c.in, b.Name.Value, c.wantValue)
		}
	}
	var b body
	if err := json.Unmarshal([]byte(`{"name": 5}`), &b); err == nil {
		t.Error("wrong type: want an error")
	}
}

func ptr[T any](v T) *T { return &v }
