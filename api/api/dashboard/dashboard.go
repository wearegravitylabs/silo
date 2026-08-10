// Package dashboard handles the portfolio dashboard HTTP endpoint.
package dashboard

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appDashboard "github.com/wearegravitylabs/silo/api/app/dashboard"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

const serviceName = "dashboard"

type handler struct{ svc appDashboard.Dashboard }

// New registers the dashboard route under /portfolios/:portfolioID/dashboard.
func New(r *gin.RouterGroup, svc appDashboard.Dashboard, mid *middleware.Middleware) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/dashboard")
	g.GET("", mid.RequirePortfolioMember(), h.get)
}

func (h *handler) get(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}

	period := c.DefaultQuery("period", "1M")

	result, err := h.svc.Get(c.Request.Context(), portfolioID, callerID, period)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "dashboard", result)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func mustCallerID(c *gin.Context) (uuid.UUID, bool) {
	id, ok := c.Request.Context().Value(contexts.ContextKeyUserID).(uuid.UUID)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
	}
	return id, ok
}

func parsePortfolioID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("portfolioID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return uuid.Nil, false
	}
	return id, true
}
