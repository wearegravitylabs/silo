// Package auth handles authentication HTTP endpoints.
package auth

import (
	"github.com/gin-gonic/gin"

	appAuth "github.com/wearegravitylabs/silo/api/app/auth"
)

type handler struct{ svc appAuth.Auth }

// New registers auth routes on the given router group.
func New(r *gin.RouterGroup, svc appAuth.Auth) {
	h := &handler{svc: svc}
	g := r.Group("/auth")
	g.POST("/signup", h.signUp)
	g.POST("/login", h.login)
	g.POST("/verify-email", h.verifyEmail)
	g.POST("/forgot-password", h.forgotPassword)
	g.POST("/reset-password", h.resetPassword)
	g.POST("/refresh-token", h.refreshToken)
}

func (h *handler) signUp(c *gin.Context)        { /* TODO */ }
func (h *handler) login(c *gin.Context)          { /* TODO */ }
func (h *handler) verifyEmail(c *gin.Context)    { /* TODO */ }
func (h *handler) forgotPassword(c *gin.Context) { /* TODO */ }
func (h *handler) resetPassword(c *gin.Context)  { /* TODO */ }
func (h *handler) refreshToken(c *gin.Context)   { /* TODO */ }
