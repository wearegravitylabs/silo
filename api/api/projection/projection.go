// Package projection handles fast-forward projection HTTP endpoints.
package projection

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appProjection "github.com/wearegravitylabs/silo/api/app/projection"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/messages"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

const serviceName = "projection"

type handler struct{ svc appProjection.Projection }

// New registers projection routes under /portfolios/:portfolioID/projections.
func New(r *gin.RouterGroup, svc appProjection.Projection, mid *middleware.Middleware) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/projections")

	member := g.Group("", mid.RequirePortfolioMember())
	member.GET("", h.listScenarios)
	member.GET("/:scenarioID", h.getScenario)
	member.POST("/:scenarioID/compute", h.compute)
	member.POST("/:scenarioID/chart", h.chart)

	editor := g.Group("", mid.RequirePortfolioEditor())
	editor.POST("", h.createScenario)
	editor.PATCH("/:scenarioID", h.updateScenario)
	editor.DELETE("/:scenarioID", h.deleteScenario)
	editor.POST("/:scenarioID/rules", h.addRule)
	editor.PATCH("/:scenarioID/rules/:ruleID", h.updateRule)
	editor.DELETE("/:scenarioID/rules/:ruleID", h.deleteRule)
	editor.POST("/:scenarioID/rules/:ruleID/toggle", h.toggleRule)
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

func parseScenarioID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("scenarioID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return uuid.Nil, false
	}
	return id, true
}

func parseRuleID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("ruleID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return uuid.Nil, false
	}
	return id, true
}

// ─── Scenario handlers ────────────────────────────────────────────────────────

func (h *handler) listScenarios(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	scenarios, err := h.svc.ListScenarios(c.Request.Context(), portfolioID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "scenarios", scenarios)
}

func (h *handler) createScenario(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	var req model.CreateScenarioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	scenario, err := h.svc.CreateScenario(c.Request.Context(), portfolioID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.Created(c, messages.ScenarioCreated, scenario)
}

func (h *handler) getScenario(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	scenarioID, ok := parseScenarioID(c)
	if !ok {
		return
	}
	scenario, err := h.svc.GetScenario(c.Request.Context(), scenarioID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "scenario", scenario)
}

func (h *handler) updateScenario(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	scenarioID, ok := parseScenarioID(c)
	if !ok {
		return
	}
	var req model.UpdateScenarioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	scenario, err := h.svc.UpdateScenario(c.Request.Context(), scenarioID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.ScenarioUpdated, scenario)
}

func (h *handler) deleteScenario(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	scenarioID, ok := parseScenarioID(c)
	if !ok {
		return
	}
	if err := h.svc.DeleteScenario(c.Request.Context(), scenarioID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.ScenarioDeleted, nil)
}

// ─── Rule handlers ────────────────────────────────────────────────────────────

func (h *handler) addRule(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	scenarioID, ok := parseScenarioID(c)
	if !ok {
		return
	}
	var req model.CreateRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	if _, err := h.svc.AddRule(c.Request.Context(), scenarioID, req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	result, err := h.svc.Compute(c.Request.Context(), scenarioID, portfolioID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.Created(c, messages.RuleAdded, result)
}

func (h *handler) updateRule(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	scenarioID, ok := parseScenarioID(c)
	if !ok {
		return
	}
	ruleID, ok := parseRuleID(c)
	if !ok {
		return
	}
	var req model.UpdateRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	if _, err := h.svc.UpdateRule(c.Request.Context(), ruleID, req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	result, err := h.svc.Compute(c.Request.Context(), scenarioID, portfolioID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.RuleUpdated, result)
}

func (h *handler) deleteRule(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	scenarioID, ok := parseScenarioID(c)
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
	result, err := h.svc.Compute(c.Request.Context(), scenarioID, portfolioID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.RuleDeleted, result)
}

func (h *handler) toggleRule(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	scenarioID, ok := parseScenarioID(c)
	if !ok {
		return
	}
	ruleID, ok := parseRuleID(c)
	if !ok {
		return
	}
	if _, err := h.svc.ToggleRule(c.Request.Context(), ruleID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	result, err := h.svc.Compute(c.Request.Context(), scenarioID, portfolioID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.RuleUpdated, result)
}

// ─── Compute & Chart ─────────────────────────────────────────────────────────

func (h *handler) compute(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	scenarioID, ok := parseScenarioID(c)
	if !ok {
		return
	}
	result, err := h.svc.Compute(c.Request.Context(), scenarioID, portfolioID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "projection", result)
}

func (h *handler) chart(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	scenarioID, ok := parseScenarioID(c)
	if !ok {
		return
	}

	// Body is optional — zero value gives sensible defaults.
	var req model.ChartRequest
	_ = c.ShouldBindJSON(&req)

	result, err := h.svc.Chart(c.Request.Context(), scenarioID, portfolioID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "chart", result)
}
