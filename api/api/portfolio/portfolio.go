// Package portfolio handles portfolio HTTP endpoints.
package portfolio

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appPortfolio "github.com/wearegravitylabs/silo/api/app/portfolio"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/messages"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

const serviceName = "portfolio"

type handler struct{ svc appPortfolio.Portfolio }

// New registers portfolio routes on the protected router group.
func New(r *gin.RouterGroup, svc appPortfolio.Portfolio, mid *middleware.Middleware) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios")

	g.POST("", h.create)
	g.GET("", h.list)

	g.GET("/:id", mid.RequirePortfolioMember(), h.get)
	g.PATCH("/:id", mid.RequirePortfolioEditor(), h.update)
	g.DELETE("/:id", mid.RequirePortfolioOwner(), h.delete)

	g.GET("/:id/members", mid.RequirePortfolioMember(), h.listMembers)
	g.POST("/:id/members", mid.RequirePortfolioOwner(), h.addMember)
	g.DELETE("/:id/members/:userID", mid.RequirePortfolioOwner(), h.removeMember)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// mustCallerID extracts the authenticated user ID and writes a 401 if missing.
// Returns (id, true) on success, (Nil, false) on failure (response already written).
func mustCallerID(c *gin.Context, svc string) (uuid.UUID, bool) {
	id, ok := c.Request.Context().Value(contexts.ContextKeyUserID).(uuid.UUID)
	if !ok {
		apiModel.HandleErrorResponse(c, svc, siloErrors.ErrUnauthorized)
	}
	return id, ok
}

func parseID(c *gin.Context, param string) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param(param))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return uuid.Nil, false
	}
	return id, true
}

// ─── Handlers ────────────────────────────────────────────────────────────────

func (h *handler) create(c *gin.Context) {
	callerID, ok := mustCallerID(c, serviceName)
	if !ok {
		return
	}

	var req model.CreatePortfolioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	portfolio, err := h.svc.Create(c.Request.Context(), callerID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.Created(c, messages.PortfolioCreated, portfolio)
}

func (h *handler) list(c *gin.Context) {
	callerID, ok := mustCallerID(c, serviceName)
	if !ok {
		return
	}

	var filter model.ListPortfoliosFilter
	_ = c.ShouldBindQuery(&filter)

	page := model.DefaultPage()
	_ = c.ShouldBindQuery(&page)

	portfolios, pageInfo, err := h.svc.ListByUser(c.Request.Context(), callerID, filter, page)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "portfolios", apiModel.PaginatedData{Items: portfolios, Page: pageInfo})
}

func (h *handler) get(c *gin.Context) {
	callerID, ok := mustCallerID(c, serviceName)
	if !ok {
		return
	}
	portfolioID, ok := parseID(c, "id")
	if !ok {
		return
	}

	portfolio, err := h.svc.GetByID(c.Request.Context(), portfolioID, callerID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "portfolio", portfolio)
}

func (h *handler) update(c *gin.Context) {
	callerID, ok := mustCallerID(c, serviceName)
	if !ok {
		return
	}
	portfolioID, ok := parseID(c, "id")
	if !ok {
		return
	}

	var req model.UpdatePortfolioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	updated, err := h.svc.Update(c.Request.Context(), portfolioID, callerID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.PortfolioUpdated, updated)
}

func (h *handler) delete(c *gin.Context) {
	callerID, ok := mustCallerID(c, serviceName)
	if !ok {
		return
	}
	portfolioID, ok := parseID(c, "id")
	if !ok {
		return
	}

	if err := h.svc.Delete(c.Request.Context(), portfolioID, callerID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.PortfolioDeleted, nil)
}

func (h *handler) listMembers(c *gin.Context) {
	callerID, ok := mustCallerID(c, serviceName)
	if !ok {
		return
	}
	portfolioID, ok := parseID(c, "id")
	if !ok {
		return
	}

	portfolio, err := h.svc.GetByID(c.Request.Context(), portfolioID, callerID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "members", portfolio.Members)
}

func (h *handler) addMember(c *gin.Context) {
	callerID, ok := mustCallerID(c, serviceName)
	if !ok {
		return
	}
	portfolioID, ok := parseID(c, "id")
	if !ok {
		return
	}

	var req model.InviteMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	if err := h.svc.AddMember(c.Request.Context(), portfolioID, callerID, req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.PortfolioMemberAdded, nil)
}

func (h *handler) removeMember(c *gin.Context) {
	callerID, ok := mustCallerID(c, serviceName)
	if !ok {
		return
	}
	portfolioID, ok := parseID(c, "id")
	if !ok {
		return
	}

	targetID, err := uuid.Parse(c.Param("userID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	if err := h.svc.RemoveMember(c.Request.Context(), portfolioID, callerID, targetID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.PortfolioMemberRemoved, nil)
}
