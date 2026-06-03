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
// Per-route middleware handles role enforcement after RequireAuth has validated the token.
func New(r *gin.RouterGroup, svc appPortfolio.Portfolio, mid *middleware.Middleware) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios")

	// No extra role middleware on create/list — any authenticated user can do these.
	g.POST("", h.create)
	g.GET("", h.list)

	// Single-resource routes — middleware checks membership/role before the handler runs.
	g.GET("/:id", mid.RequirePortfolioMember(), h.get)
	g.PATCH("/:id", mid.RequirePortfolioEditor(), h.update)
	g.DELETE("/:id", mid.RequirePortfolioOwner(), h.delete)

	// Member management — only owners can invite or remove.
	g.GET("/:id/members", mid.RequirePortfolioMember(), h.listMembers)
	g.POST("/:id/members", mid.RequirePortfolioOwner(), h.addMember)
	g.DELETE("/:id/members/:userID", mid.RequirePortfolioOwner(), h.removeMember)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func callerID(c *gin.Context) (uuid.UUID, bool) {
	id, ok := c.Request.Context().Value(contexts.ContextKeyUserID).(uuid.UUID)
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
//	@Summary	List the caller's portfolios
//	@Tags		portfolios
//	@Produce	json
//	@Param		name		query	string	false	"Name filter (partial match)"
//	@Param		currency	query	string	false	"Base currency filter"
//	@Param		role		query	string	false	"Role filter (owner|editor|viewer)"
//	@Success	200			{object}	apiModel.APIResponse
//	@Router		/portfolios [get]
func (h *handler) list(c *gin.Context) {
	userID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
		return
	}

	var filter model.ListPortfoliosFilter
	_ = c.ShouldBindQuery(&filter)

	page := model.DefaultPage()
	_ = c.ShouldBindQuery(&page)

	portfolios, pageInfo, err := h.svc.ListByUser(c.Request.Context(), userID, filter, page)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "portfolios", apiModel.PaginatedData{Items: portfolios, Page: pageInfo})
}

// get godoc
//
//	@Summary	Get a portfolio by ID (any member)
//	@Tags		portfolios
//	@Produce	json
//	@Param		id	path		string	true	"Portfolio ID"
//	@Success	200	{object}	model.Portfolio
//	@Router		/portfolios/{id} [get]
func (h *handler) get(c *gin.Context) {
	portfolioID, ok := parseID(c, "id")
	if !ok {
		return
	}

	portfolio, err := h.svc.GetByID(c.Request.Context(), portfolioID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "portfolio", portfolio)
}

// update godoc
//
//	@Summary	Update a portfolio (Owner or Editor)
//	@Tags		portfolios
//	@Accept		json
//	@Produce	json
//	@Param		id		path		string						true	"Portfolio ID"
//	@Param		body	body		model.UpdatePortfolioRequest	true	"Fields to update"
//	@Success	200		{object}	model.Portfolio
//	@Router		/portfolios/{id} [patch]
func (h *handler) update(c *gin.Context) {
	portfolioID, ok := parseID(c, "id")
	if !ok {
		return
	}

	var req model.UpdatePortfolioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	updated, err := h.svc.Update(c.Request.Context(), portfolioID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.PortfolioUpdated, updated)
}

// delete godoc
//
//	@Summary	Delete a portfolio (Owner only)
//	@Tags		portfolios
//	@Produce	json
//	@Param		id	path	string	true	"Portfolio ID"
//	@Success	200	{object}	apiModel.APIResponse
//	@Router		/portfolios/{id} [delete]
func (h *handler) delete(c *gin.Context) {
	portfolioID, ok := parseID(c, "id")
	if !ok {
		return
	}

	if err := h.svc.Delete(c.Request.Context(), portfolioID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.PortfolioDeleted, nil)
}

// listMembers godoc
//
//	@Summary	List portfolio members (any member)
//	@Tags		portfolios
//	@Produce	json
//	@Param		id	path		string	true	"Portfolio ID"
//	@Success	200	{object}	apiModel.APIResponse
//	@Router		/portfolios/{id}/members [get]
func (h *handler) listMembers(c *gin.Context) {
	portfolioID, ok := parseID(c, "id")
	if !ok {
		return
	}

	portfolio, err := h.svc.GetByID(c.Request.Context(), portfolioID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "members", portfolio.Members)
}

// addMember godoc
//
//	@Summary	Add a member to a portfolio (Owner only)
//	@Tags		portfolios
//	@Accept		json
//	@Produce	json
//	@Param		id		path		string						true	"Portfolio ID"
//	@Param		body	body		model.InviteMemberRequest	true	"Email and role"
//	@Success	200		{object}	apiModel.APIResponse
//	@Router		/portfolios/{id}/members [post]
func (h *handler) addMember(c *gin.Context) {
	userID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
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

	if err := h.svc.AddMember(c.Request.Context(), portfolioID, userID, req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.PortfolioMemberAdded, nil)
}

// removeMember godoc
//
//	@Summary	Remove a member from a portfolio (Owner only)
//	@Tags		portfolios
//	@Produce	json
//	@Param		id		path	string	true	"Portfolio ID"
//	@Param		userID	path	string	true	"Member's user ID"
//	@Success	200		{object}	apiModel.APIResponse
//	@Router		/portfolios/{id}/members/{userID} [delete]
func (h *handler) removeMember(c *gin.Context) {
	portfolioID, ok := parseID(c, "id")
	if !ok {
		return
	}

	targetID, err := uuid.Parse(c.Param("userID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	if err := h.svc.RemoveMember(c.Request.Context(), portfolioID, targetID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.PortfolioMemberRemoved, nil)
}
