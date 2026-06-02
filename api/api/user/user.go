package user

import (
	"github.com/gin-gonic/gin"
	appUser "github.com/wearegravitylabs/silo/api/app/user"
)

type handler struct{ svc appUser.User }

// New registers user routes on the given protected router group.
func New(r *gin.RouterGroup, svc appUser.User) {
	h := &handler{svc: svc}
	g := r.Group("/users")
	g.GET("/me", h.getMe)
	g.PATCH("/me", h.updateProfile)
	g.PATCH("/me/password", h.changePassword)
	g.DELETE("/me", h.deleteAccount)
}

func (h *handler) getMe(c *gin.Context)        { /* TODO */ }
func (h *handler) updateProfile(c *gin.Context) { /* TODO */ }
func (h *handler) changePassword(c *gin.Context) { /* TODO */ }
func (h *handler) deleteAccount(c *gin.Context) { /* TODO */ }
