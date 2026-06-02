package autopilot

import (
	"github.com/gin-gonic/gin"
	appAutopilot "github.com/wearegravitylabs/silo/api/app/autopilot"
)

type handler struct{ svc appAutopilot.Autopilot }

// New registers autopilot rule routes.
func New(r *gin.RouterGroup, svc appAutopilot.Autopilot) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/autopilot")
	g.POST("/rules", h.createRule)
	g.GET("/rules", h.listRules)
	g.GET("/rules/:id", h.getRule)
	g.POST("/rules/:id/pause", h.pauseRule)
	g.POST("/rules/:id/resume", h.resumeRule)
	g.DELETE("/rules/:id", h.deleteRule)
}

func (h *handler) createRule(c *gin.Context) { /* TODO */ }
func (h *handler) listRules(c *gin.Context)  { /* TODO */ }
func (h *handler) getRule(c *gin.Context)    { /* TODO */ }
func (h *handler) pauseRule(c *gin.Context)  { /* TODO */ }
func (h *handler) resumeRule(c *gin.Context) { /* TODO */ }
func (h *handler) deleteRule(c *gin.Context) { /* TODO */ }
