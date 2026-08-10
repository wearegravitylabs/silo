package model

import (
	"fmt"
	"time"
)

// DateOnly is a time.Time that accepts "YYYY-MM-DD" or RFC 3339 in JSON input
// and always marshals back as "YYYY-MM-DD".
type DateOnly time.Time

func (d *DateOnly) UnmarshalJSON(b []byte) error {
	s := string(b)
	// Strip surrounding quotes.
	if len(s) >= 2 && s[0] == '"' && s[len(s)-1] == '"' {
		s = s[1 : len(s)-1]
	}
	// Try date-only first.
	if t, err := time.Parse("2006-01-02", s); err == nil {
		*d = DateOnly(t.UTC())
		return nil
	}
	// Fall back to RFC 3339.
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		*d = DateOnly(t.UTC())
		return nil
	}
	return fmt.Errorf("cannot parse %q as a date — use YYYY-MM-DD or RFC 3339", s)
}

func (d DateOnly) MarshalJSON() ([]byte, error) {
	return []byte(`"` + time.Time(d).Format("2006-01-02") + `"`), nil
}

// Time returns the underlying time.Time value.
func (d DateOnly) Time() time.Time { return time.Time(d) }
