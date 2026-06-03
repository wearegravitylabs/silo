// Package middleware provides Gin HTTP middleware for the Silo API.
package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/requestid"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	modelEnv "github.com/wearegravitylabs/silo/api/model/env"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/environment"
	"github.com/wearegravitylabs/silo/api/pkg/helpers"
	siloJWT "github.com/wearegravitylabs/silo/api/pkg/jwt"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
	"github.com/wearegravitylabs/silo/api/store"
)

// serviceName is included in every error response from infrastructure middleware.
const serviceName = "middleware"

// Middleware holds shared state for all middleware functions.
type Middleware struct {
	env            *environment.Env
	logger         zerolog.Logger
	portfolioStore store.PortfolioDatabase
}

// New returns a Middleware instance.
// portfolioStore is used by portfolio-role middleware to verify caller membership.
func New(env *environment.Env, portfolioStore store.PortfolioDatabase) *Middleware {
	return &Middleware{
		env:            env,
		logger:         siloLogger.New(),
		portfolioStore: portfolioStore,
	}
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

// CORSMiddleware returns a configured CORS handler.
func (m *Middleware) CORSMiddleware() gin.HandlerFunc {
	allowedOrigins := m.env.GetWithDefault(modelEnv.CORSAllowedOrigins, "http://localhost:3000")
	return cors.New(cors.Config{
		AllowOrigins:     []string{allowedOrigins},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Request-ID"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	})
}

// LoggerMiddleware logs each request with method, path, status, latency, and request ID.
func (m *Middleware) LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		m.logger.Info().
			Str("method", c.Request.Method).
			Str("path", c.FullPath()).
			Int("status", c.Writer.Status()).
			Dur("latency", time.Since(start)).
			Str("ip", c.ClientIP()).
			Str("request_id", requestid.Get(c)).
			Msg("request")
	}
}

// AuthMiddleware validates the JWT Bearer token and injects the authenticated
// user ID into the request context. Aborts with 401 on missing or invalid token.
func (m *Middleware) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			abortUnauthorized(c, siloErrors.ErrUnauthorized)
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		secret := m.env.Get(modelEnv.JWTSigningSecret)

		userID, err := siloJWT.ValidateToken(tokenStr, secret)
		if err != nil {
			abortUnauthorized(c, siloErrors.ErrInvalidToken)
			return
		}

		ctx := context.WithValue(c.Request.Context(), contexts.ContextKeyUserID, userID)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

// RequireAuth is the route-group alias for AuthMiddleware.
func (m *Middleware) RequireAuth() gin.HandlerFunc {
	return m.AuthMiddleware()
}

// ─── Portfolio role middleware ─────────────────────────────────────────────────
//
// These middleware functions enforce portfolio membership and role at the HTTP
// layer — before the request reaches any service or business-logic code.
//
// Portfolio ID resolution order:
//  1. :portfolioID param  — used by sub-resource routes (.../portfolios/:portfolioID/folders/...)
//  2. :id param           — used by portfolio-level routes (.../portfolios/:id)

// RequirePortfolioMember aborts with 403 when the caller is not a member
// (any role) of the portfolio identified in the URL.
func (m *Middleware) RequirePortfolioMember() gin.HandlerFunc {
	return m.requirePortfolioRole(model.RoleViewer)
}

// RequirePortfolioEditor aborts with 403 when the caller is not at least an
// Editor (Owner or Editor) on the portfolio identified in the URL.
func (m *Middleware) RequirePortfolioEditor() gin.HandlerFunc {
	return m.requirePortfolioRole(model.RoleEditor)
}

// RequirePortfolioOwner aborts with 403 when the caller is not an Owner of
// the portfolio identified in the URL.
func (m *Middleware) RequirePortfolioOwner() gin.HandlerFunc {
	return m.requirePortfolioRole(model.RoleOwner)
}

// requirePortfolioRole is the shared implementation for the portfolio-role middleware.
func (m *Middleware) requirePortfolioRole(minRole model.PortfolioMemberRole) gin.HandlerFunc {
	roleOrder := map[model.PortfolioMemberRole]int{
		model.RoleViewer: 1,
		model.RoleEditor: 2,
		model.RoleOwner:  3,
	}

	return func(c *gin.Context) {
		// The user must already be authenticated (RequireAuth runs first).
		callerID, ok := c.Request.Context().Value(contexts.ContextKeyUserID).(uuid.UUID)
		if !ok {
			abortUnauthorized(c, siloErrors.ErrUnauthorized)
			return
		}

		// Resolve the portfolio ID from the URL.
		rawID := c.Param("portfolioID")
		if rawID == "" {
			rawID = c.Param("id")
		}
		portfolioID, err := uuid.Parse(rawID)
		if err != nil {
			abortForbidden(c, siloErrors.ErrInsufficientPermission)
			return
		}

		// Fetch the caller's membership record.
		member, err := m.portfolioStore.GetMember(c.Request.Context(), portfolioID, callerID)
		if err != nil {
			// Not a member of this portfolio.
			abortForbidden(c, siloErrors.ErrInsufficientPermission)
			return
		}

		if roleOrder[member.Role] < roleOrder[minRole] {
			abortForbidden(c, siloErrors.ErrInsufficientPermission)
			return
		}

		c.Next()
	}
}

// ─── Health check ─────────────────────────────────────────────────────────────

// HealthCheck returns a simple liveness probe handler.
func HealthCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, apiModel.APIResponse{
			Code:    http.StatusOK,
			Data:    map[string]string{"service": "silo-api"},
			Message: helpers.StringPtr("ok"),
			Error:   nil,
		})
	}
}

// ─── Response helpers ─────────────────────────────────────────────────────────

// abortUnauthorized writes a 401 and stops the handler chain.
func abortUnauthorized(c *gin.Context, e *siloErrors.TranslatableError) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, apiModel.APIResponse{
		Code:    http.StatusUnauthorized,
		Data:    nil,
		Message: helpers.StringPtr("an error has occurred"),
		Error: &apiModel.ErrorData{
			ID:      requestid.Get(c),
			Service: serviceName,
			Code:    e.Code,
			Message: e.Message,
		},
	})
}

// abortForbidden writes a 403 and stops the handler chain.
func abortForbidden(c *gin.Context, e *siloErrors.TranslatableError) {
	c.AbortWithStatusJSON(http.StatusForbidden, apiModel.APIResponse{
		Code:    http.StatusForbidden,
		Data:    nil,
		Message: helpers.StringPtr("an error has occurred"),
		Error: &apiModel.ErrorData{
			ID:      requestid.Get(c),
			Service: serviceName,
			Code:    e.Code,
			Message: e.Message,
		},
	})
}
