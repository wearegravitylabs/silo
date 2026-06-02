package insight

import (
	"github.com/gin-gonic/gin"
	appInsight "github.com/wearegravitylabs/silo/api/app/insight"
)

type handler struct{ svc appInsight.Insight }

// New registers insight routes.
func New(r *gin.RouterGroup, svc appInsight.Insight) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/insights")
	g.GET("/daily", h.dailySummary)
	g.POST("/query", h.nlpQuery)
	g.POST("/fast-forward", h.fastForward)
}

func (h *handler) dailySummary(c *gin.Context) { /* TODO */ }
func (h *handler) nlpQuery(c *gin.Context)     { /* TODO */ }
func (h *handler) fastForward(c *gin.Context)  { /* TODO */ }
