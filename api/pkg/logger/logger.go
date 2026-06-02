// Package logger provides a request-scoped zerolog logger.
package logger

import (
	"context"
	"os"

	"github.com/rs/zerolog"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
)

const (
	LogStrKeyMethod    = "method"
	LogStrKeyRequestID = "request_id"
	LogStrKeyUserID    = "user_id"
)

// New creates a new zerolog.Logger writing to stderr.
func New() zerolog.Logger {
	return zerolog.New(os.Stderr).With().Timestamp().Logger()
}

// InjectInCtx stores the logger in the context.
func InjectInCtx(ctx context.Context, log zerolog.Logger) context.Context {
	return context.WithValue(ctx, contexts.ContextKeyLogger, log)
}

// FromCtx retrieves the request-scoped logger from context.
// Falls back to a new logger if none is stored.
func FromCtx(ctx context.Context) zerolog.Logger {
	if log, ok := ctx.Value(contexts.ContextKeyLogger).(zerolog.Logger); ok {
		return log
	}
	return New()
}
