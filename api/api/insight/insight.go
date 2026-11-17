package insight

import (
	"github.com/gin-gonic/gin"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appInsight "github.com/wearegravitylabs/silo/api/app/insight"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

const serviceName = "insight"

type handler struct{ svc appInsight.Insight }

// New registers insight routes under /portfolios/:portfolioID/insights.
//
// AI insights are a hosted-service feature. The open-source server answers
// 501 NOT_AVAILABLE so the app can hide the insight card instead of erroring.
func New(r *gin.RouterGroup, svc appInsight.Insight, mid *middleware.Middleware) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/insights", mid.RequireSection("insights"), mid.RequirePortfolioMember())
	g.GET("/daily", h.notAvailable)
	g.POST("/query", h.notAvailable)
	g.POST("/fast-forward", h.notAvailable)
}

func (h *handler) notAvailable(c *gin.Context) {
	apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrNotAvailable)
}
