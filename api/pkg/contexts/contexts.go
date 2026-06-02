// Package contexts defines typed context keys used throughout the application.
package contexts

type contextKey string

const (
	// ContextKeyRequestID is the key for the unique request ID injected by the requestid middleware.
	ContextKeyRequestID contextKey = "request_id"

	// ContextKeyUserID is the key for the authenticated user's UUID extracted from the JWT.
	ContextKeyUserID contextKey = "user_id"

	// ContextKeyLogger is the key for the request-scoped zerolog.Logger.
	ContextKeyLogger contextKey = "logger"

	// ContextKeyPortfolioID is the key for the active portfolio UUID when set by route middleware.
	ContextKeyPortfolioID contextKey = "portfolio_id"
)
