package snapshot

import (
	"github.com/gin-gonic/gin"
	appSnapshot "github.com/wearegravitylabs/silo/api/app/snapshot"
)

type handler struct{ svc appSnapshot.Snapshot }

// New registers snapshot routes.
func New(r *gin.RouterGroup, svc appSnapshot.Snapshot) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/snapshots")
	g.GET("", h.list)
	g.GET("/latest", h.latest)
}

func (h *handler) list(c *gin.Context)   { /* TODO */ }
func (h *handler) latest(c *gin.Context) { /* TODO */ }
