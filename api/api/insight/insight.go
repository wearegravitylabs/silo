package insight

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appInsight "github.com/wearegravitylabs/silo/api/app/insight"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

const serviceName = "insight"

type handler struct{ svc appInsight.Insight }

// New registers insight routes under /portfolios/:portfolioID/insights.
//
// The open-source Insight answers 501 NOT_AVAILABLE, so the app can hide the
// insight card; silo-cloud passes its own Insight that calls the AI.
func New(r *gin.RouterGroup, svc appInsight.Insight, mid *middleware.Middleware) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/insights", mid.RequireSection("insights"), mid.RequirePortfolioMember())
	g.GET("/daily", h.daily)
	g.POST("/query", h.query)
	g.POST("/fast-forward", h.fastForward)
}

func portfolioID(c *gin.Context) uuid.UUID {
	id, _ := uuid.Parse(c.Param("portfolioID"))
	return id
}

func (h *handler) daily(c *gin.Context) {
	res, err := h.svc.DailySummary(c.Request.Context(), portfolioID(c))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "daily insight", res)
}

func (h *handler) query(c *gin.Context) {
	var req struct {
		Query string `json:"query" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	answer, err := h.svc.QueryNLP(c.Request.Context(), portfolioID(c), req.Query)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "answer", map[string]string{"answer": answer})
}

func (h *handler) fastForward(c *gin.Context) {
	var req appInsight.FastForwardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	points, err := h.svc.FastForward(c.Request.Context(), portfolioID(c), req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "projection", points)
}
