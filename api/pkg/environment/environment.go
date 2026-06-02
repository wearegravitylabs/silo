// Package environment handles application configuration from environment variables.
package environment

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Env provides typed access to environment variables.
type Env struct{}

// New loads environment variables from a .env file if present.
// Variables already set in the OS environment take precedence.
func New() (*Env, error) {
	// godotenv.Load does not overwrite existing env vars.
	_ = godotenv.Load()
	return &Env{}, nil
}

// Get returns the value of the given environment variable key.
func (e *Env) Get(key string) string {
	return os.Getenv(key)
}

// GetWithDefault returns the env var value or a default if it is empty.
func (e *Env) GetWithDefault(key, defaultVal string) string {
	if v := e.Get(key); v != "" {
		return v
	}
	return defaultVal
}

// GetInt returns the env var parsed as an int, or 0 on failure.
func (e *Env) GetInt(key string) int {
	v, _ := strconv.Atoi(e.Get(key))
	return v
}

// GetBool returns true if the env var is "true" (case-insensitive).
func (e *Env) GetBool(key string) bool {
	return strings.EqualFold(e.Get(key), "true")
}

// IsSandbox returns true when the application is running in sandbox mode.
func (e *Env) IsSandbox() bool {
	return e.GetBool("IS_SANDBOX_MODE")
}

// IsProduction returns true when APP_ENV is "production".
func (e *Env) IsProduction() bool {
	return strings.EqualFold(e.Get("APP_ENV"), "production")
}
