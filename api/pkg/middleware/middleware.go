// Package middleware provides Gin HTTP middleware for the Silo API.
package middleware

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"

	"github.com/wearegravitylabs/silo/api/pkg/environment"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
	modelEnv "github.com/wearegravitylabs/silo/api/model/env"
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

// AuthMiddleware validates the JWT Bearer token and injects the userID into context.
func (m *Middleware) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: extract and validate JWT from Authorization header, set userID in context
		c.Next()
	}
}

// RequireAuth is an alias for AuthMiddleware for use in route groups.
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
