package model

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

// NoteTags is a note's list of tags. In JSON it is a plain array
// (["tax", "2026"]). For older clients it also accepts the earlier
// {"list": [...]} shape, and it reads rows stored that way.
type NoteTags []string

// UnmarshalJSON accepts ["a", "b"] or {"list": ["a", "b"]}.
func (t *NoteTags) UnmarshalJSON(b []byte) error {
	var list []string
	if err := json.Unmarshal(b, &list); err == nil {
		*t = list
		return nil
	}
	var wrapped struct {
		List []string `json:"list"`
	}
	if err := json.Unmarshal(b, &wrapped); err != nil {
		return fmt.Errorf("tags must be a list of strings")
	}
	*t = wrapped.List
	return nil
}

// Value stores the tags as a JSON array.
func (t NoteTags) Value() (driver.Value, error) {
	if t == nil {
		return nil, nil
	}
	return json.Marshal([]string(t))
}

// Scan reads tags stored as an array or as {"list": [...]}.
func (t *NoteTags) Scan(v any) error {
	switch b := v.(type) {
	case nil:
		*t = nil
		return nil
	case []byte:
		return t.UnmarshalJSON(b)
	case string:
		return t.UnmarshalJSON([]byte(b))
	}
	return fmt.Errorf("cannot scan %T into NoteTags", v)
}
