// Package helpers provides shared utility functions used across the application.
package helpers

import (
	"strconv"
	"strings"
	"time"
)

// ParseDuration parses a duration string that supports both the standard Go format
// ("15m", "1h", "2h30m") and a day-suffix shorthand ("7d", "30d").
// Returns fallback when the string is empty or cannot be parsed.
func ParseDuration(s string, fallback time.Duration) time.Duration {
	s = strings.TrimSpace(s)
	if s == "" {
		return fallback
	}
	if strings.HasSuffix(s, "d") {
		days, err := strconv.Atoi(strings.TrimSuffix(s, "d"))
		if err == nil {
			return time.Duration(days) * 24 * time.Hour
		}
	}
	d, err := time.ParseDuration(s)
	if err != nil {
		return fallback
	}
	return d
}

// StringPtr returns a pointer to the given string value.
// Useful when building structs that require optional string fields.
func StringPtr(s string) *string {
	return &s
}
