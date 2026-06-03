// Package middleware provides Gin HTTP middleware for the Silo API.
package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	modelEnv "github.com/wearegravitylabs/silo/api/model/env"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/environment"
	siloJWT "github.com/wearegravitylabs/silo/api/pkg/jwt"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

// Middleware holds shared state for all middleware functions.
type Middleware struct {
	env    *environment.Env
	logger zerolog.Logger
}

// New returns a Middleware instance.
func New(env *environment.Env) *Middleware {
	return &Middleware{
		env:    env,
		logger: siloLogger.New(),
	}
}

// CORSMiddleware returns a configured CORS middleware.
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

// LoggerMiddleware logs each request with method, path, status, and latency.
func (m *Middleware) LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		latency := time.Since(start)

		m.logger.Info().
			Str("method", c.Request.Method).
			Str("path", c.FullPath()).
			Int("status", c.Writer.Status()).
			Dur("latency", latency).
			Str("ip", c.ClientIP()).
			Msg("request")
	}
}

// AuthMiddleware validates the JWT Bearer token and injects the userID into the request context.
// Protected routes should use RequireAuth() which is an alias for this.
func (m *Middleware) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, apiModel.APIResponse{
				Success: false,
				Error: &apiModel.ErrorData{
					Code:    siloErrors.ErrUnauthorized.Code,
					Message: siloErrors.ErrUnauthorized.Message,
				},
			})
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		secret := m.env.Get(modelEnv.JWTSigningSecret)

		userID, err := siloJWT.ValidateToken(tokenStr, secret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, apiModel.APIResponse{
				Success: false,
				Error: &apiModel.ErrorData{
					Code:    siloErrors.ErrInvalidToken.Code,
					Message: siloErrors.ErrInvalidToken.Message,
				},
			})
			return
		}

		// Inject the validated userID into the request context.
		ctx := context.WithValue(c.Request.Context(), contexts.ContextKeyUserID, userID)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

// RequireAuth is the standard middleware for protecting routes — validates the JWT.
func (m *Middleware) RequireAuth() gin.HandlerFunc {
	return m.AuthMiddleware()
}

// HealthCheck returns a simple liveness probe handler.
func HealthCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "silo-api",
		})
	}
}
