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
)

const serviceName = "portfolio"

type handler struct{ svc appPortfolio.Portfolio }

// New registers portfolio routes on the given protected router group.
func New(r *gin.RouterGroup, svc appPortfolio.Portfolio) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios")
	g.POST("", h.create)
	g.GET("", h.list)
	g.GET("/:id", h.get)
	g.PATCH("/:id", h.update)
	g.DELETE("/:id", h.delete)
	g.POST("/:id/members", h.addMember)
	g.DELETE("/:id/members/:userID", h.removeMember)
	g.GET("/:id/members", h.listMembers)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// callerID extracts the authenticated user's UUID from the Gin context.
func callerID(c *gin.Context) (uuid.UUID, bool) {
	id, ok := c.Request.Context().Value(contexts.ContextKeyUserID).(uuid.UUID)
	return id, ok
}

// parsePortfolioID parses the :id path param and writes an error response on failure.
func parsePortfolioID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return uuid.Nil, false
	}
	return id, true
}

// ─── Handlers ────────────────────────────────────────────────────────────────

// create godoc
//
//	@Summary	Create a portfolio
//	@Tags		portfolios
//	@Accept		json
//	@Produce	json
//	@Param		body	body		model.CreatePortfolioRequest	true	"Portfolio details"
//	@Success	201		{object}	model.Portfolio
//	@Router		/portfolios [post]
func (h *handler) create(c *gin.Context) {
	userID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
		return
	}

	var req model.CreatePortfolioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	portfolio, err := h.svc.Create(c.Request.Context(), userID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.Created(c, messages.PortfolioCreated, portfolio)
}

// list godoc
//
//	@Summary	List portfolios for the authenticated user
//	@Tags		portfolios
//	@Produce	json
//	@Param		name		query	string	false	"Filter by name (partial match)"
//	@Param		currency	query	string	false	"Filter by base currency"
//	@Param		role		query	string	false	"Filter by role (owner|editor|viewer)"
//	@Param		page		query	int		false	"Page number (default 1)"
//	@Param		size		query	int		false	"Page size (default 20, max 100)"
//	@Param		sort_by		query	string	false	"Sort field (default created_at)"
//	@Param		sort_desc	query	bool	false	"Sort descending (default true)"
//	@Success	200			{object}	apiModel.APIResponse
//	@Router		/portfolios [get]
func (h *handler) list(c *gin.Context) {
	userID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
		return
	}

	var filter model.ListPortfoliosFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	page := model.DefaultPage()
	if err := c.ShouldBindQuery(&page); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	portfolios, pageInfo, err := h.svc.ListByUser(c.Request.Context(), userID, filter, page)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "portfolios", apiModel.PaginatedData{
		Items: portfolios,
		Page:  pageInfo,
	})
}

// get godoc
//
//	@Summary	Get a portfolio by ID
//	@Tags		portfolios
//	@Produce	json
//	@Param		id	path		string	true	"Portfolio ID"
//	@Success	200	{object}	model.Portfolio
//	@Router		/portfolios/{id} [get]
func (h *handler) get(c *gin.Context) {
	userID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
		return
	}

	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}

	portfolio, err := h.svc.GetByID(c.Request.Context(), portfolioID, userID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "portfolio", portfolio)
}

// update godoc
//
//	@Summary	Update a portfolio
//	@Tags		portfolios
//	@Accept		json
//	@Produce	json
//	@Param		id		path		string						true	"Portfolio ID"
//	@Param		body	body		model.UpdatePortfolioRequest	true	"Fields to update"
//	@Success	200		{object}	model.Portfolio
//	@Router		/portfolios/{id} [patch]
func (h *handler) update(c *gin.Context) {
	userID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
		return
	}

	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}

	var req model.UpdatePortfolioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	updated, err := h.svc.Update(c.Request.Context(), portfolioID, userID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.PortfolioUpdated, updated)
}

// delete godoc
//
//	@Summary	Delete a portfolio (owner only)
//	@Tags		portfolios
//	@Produce	json
//	@Param		id	path	string	true	"Portfolio ID"
//	@Success	200	{object}	apiModel.APIResponse
//	@Router		/portfolios/{id} [delete]
func (h *handler) delete(c *gin.Context) {
	userID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
		return
	}

	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}

	if err := h.svc.Delete(c.Request.Context(), portfolioID, userID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.PortfolioDeleted, nil)
}

// addMember godoc
//
//	@Summary	Add a member to a portfolio (owner only)
//	@Tags		portfolios
//	@Accept		json
//	@Produce	json
//	@Param		id		path		string						true	"Portfolio ID"
//	@Param		body	body		model.InviteMemberRequest	true	"Member email and role"
//	@Success	200		{object}	apiModel.APIResponse
//	@Router		/portfolios/{id}/members [post]
func (h *handler) addMember(c *gin.Context) {
	userID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
		return
	}

	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}

	var req model.InviteMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	if err := h.svc.AddMember(c.Request.Context(), portfolioID, userID, req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.PortfolioMemberAdded, nil)
}

// removeMember godoc
//
//	@Summary	Remove a member from a portfolio (owner only)
//	@Tags		portfolios
//	@Produce	json
//	@Param		id		path	string	true	"Portfolio ID"
//	@Param		userID	path	string	true	"Member's user ID"
//	@Success	200		{object}	apiModel.APIResponse
//	@Router		/portfolios/{id}/members/{userID} [delete]
func (h *handler) removeMember(c *gin.Context) {
	callerUserID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
		return
	}

	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}

	targetID, err := uuid.Parse(c.Param("userID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	if err := h.svc.RemoveMember(c.Request.Context(), portfolioID, callerUserID, targetID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.PortfolioMemberRemoved, nil)
}

// listMembers godoc
//
//	@Summary	List all members of a portfolio
//	@Tags		portfolios
//	@Produce	json
//	@Param		id	path		string	true	"Portfolio ID"
//	@Success	200	{object}	apiModel.APIResponse
//	@Router		/portfolios/{id}/members [get]
func (h *handler) listMembers(c *gin.Context) {
	userID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
		return
	}

	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}

	// Any member of the portfolio can view the member list.
	portfolio, err := h.svc.GetByID(c.Request.Context(), portfolioID, userID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "members", portfolio.Members)
}
