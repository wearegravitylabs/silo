// Package autopilot handles autopilot rule HTTP endpoints.
package autopilot

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appAutopilot "github.com/wearegravitylabs/silo/api/app/autopilot"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/messages"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

const serviceName = "autopilot"

type handler struct{ svc appAutopilot.Autopilot }

// New registers autopilot routes under /portfolios/:portfolioID/autopilot.
func New(r *gin.RouterGroup, svc appAutopilot.Autopilot, mid *middleware.Middleware) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/autopilot")

	member := g.Group("", mid.RequirePortfolioMember())
	member.GET("/rules", h.listRules)
	member.GET("/rules/:id", h.getRule)

	editor := g.Group("", mid.RequirePortfolioEditor())
	editor.POST("/rules", h.createRule)
	editor.POST("/rules/:id/pause", h.pauseRule)
	editor.POST("/rules/:id/resume", h.resumeRule)
	editor.DELETE("/rules/:id", h.deleteRule)
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

func parseRuleID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return uuid.Nil, false
	}
	return id, true
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

func (h *handler) createRule(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	var req model.CreateAutopilotRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	rule, err := h.svc.CreateRule(c.Request.Context(), portfolioID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.Created(c, messages.AutopilotRuleCreated, rule)
}

func (h *handler) listRules(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	rules, err := h.svc.ListByPortfolio(c.Request.Context(), portfolioID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "rules", rules)
}

func (h *handler) getRule(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	ruleID, ok := parseRuleID(c)
	if !ok {
		return
	}
	rule, err := h.svc.GetRule(c.Request.Context(), ruleID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "rule", rule)
}

func (h *handler) pauseRule(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	ruleID, ok := parseRuleID(c)
	if !ok {
		return
	}
	if err := h.svc.PauseRule(c.Request.Context(), ruleID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.AutopilotRulePaused, nil)
}

func (h *handler) resumeRule(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	ruleID, ok := parseRuleID(c)
	if !ok {
		return
	}
	if err := h.svc.ResumeRule(c.Request.Context(), ruleID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.AutopilotRuleResumed, nil)
}

func (h *handler) deleteRule(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	ruleID, ok := parseRuleID(c)
	if !ok {
		return
	}
	if err := h.svc.DeleteRule(c.Request.Context(), ruleID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.AutopilotRuleDeleted, nil)
}
