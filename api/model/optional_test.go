package model

import (
	"encoding/json"
	"testing"
	"time"
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

func TestRecordTime(t *testing.T) {
	now := time.Now().UTC()
	if got, ok := RecordTime(nil); !ok || now.Sub(got) > time.Minute {
		t.Errorf("nil date: got %v %v, want now", got, ok)
	}
	past := DateOnly(time.Date(2024, 3, 9, 15, 0, 0, 0, time.UTC))
	if got, ok := RecordTime(&past); !ok || !got.Equal(time.Date(2024, 3, 9, 0, 0, 0, 0, time.UTC)) {
		t.Errorf("past date: got %v %v, want midnight 2024-03-09", got, ok)
	}
	future := DateOnly(now.AddDate(0, 0, 2))
	if _, ok := RecordTime(&future); ok {
		t.Error("future date: want not ok")
	}
}

func TestNoteTags(t *testing.T) {
	for _, in := range []string{`["tax","2026"]`, `{"list":["tax","2026"]}`} {
		var tags NoteTags
		if err := json.Unmarshal([]byte(in), &tags); err != nil || len(tags) != 2 || tags[0] != "tax" {
			t.Errorf("%s: got %v %v", in, tags, err)
		}
	}
	var tags NoteTags
	if err := json.Unmarshal([]byte(`"tax"`), &tags); err == nil {
		t.Error("a plain string: want an error")
	}
	out, _ := json.Marshal(NoteTags{"a"})
	if string(out) != `["a"]` {
		t.Errorf("marshal = %s, want [\"a\"]", out)
	}
}
