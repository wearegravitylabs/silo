// Package asset handles asset HTTP endpoints.
package asset

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appAsset "github.com/wearegravitylabs/silo/api/app/asset"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/messages"
)

const serviceName = "asset"

type handler struct{ svc appAsset.Asset }

// New registers asset routes under /portfolios/:portfolioID/assets.
func New(r *gin.RouterGroup, svc appAsset.Asset) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/assets")

	// Ticker search (two-step flow — step 1: preview before creating)
	g.GET("/ticker/search", h.tickerSearch)
	g.GET("/ticker/preview", h.tickerPreview)

	// Asset CRUD
	g.POST("", h.create)
	g.GET("", h.list)
	g.GET("/:id", h.get)
	g.PATCH("/:id", h.update)
	g.DELETE("/:id", h.delete)

	// Lot management
	g.GET("/:id/lots", h.listLots)
	g.POST("/:id/lots", h.addLot)
	g.DELETE("/:id/lots/:lotID", h.deleteLot)

	// Cash flows (income and expenses)
	g.GET("/:id/cash-flows", h.listCashFlows)
	g.POST("/:id/cash-flows", h.addCashFlow)
	g.DELETE("/:id/cash-flows/:flowID", h.deleteCashFlow)

	// Value history (for charting)
	g.GET("/:id/value-history", h.listValueHistory)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

func parseAssetID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return uuid.Nil, false
	}
	return id, true
}

// ─── Ticker search ────────────────────────────────────────────────────────────

// tickerSearch searches Yahoo Finance for tickers matching a query string.
// Used in step 1 of the two-step add-stock flow.
//
//	GET /portfolios/:portfolioID/assets/ticker/search?q=Tesla
func (h *handler) tickerSearch(c *gin.Context) {
	q := c.Query("q")
	if q == "" {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	results, err := h.svc.SearchTicker(c.Request.Context(), q)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrMarketDataUnavailable)
		return
	}

	apiModel.OK(c, "results", results)
}

// tickerPreview returns the current quote for a single ticker symbol.
// Used to show live price + logo before the user confirms the add.
//
//	GET /portfolios/:portfolioID/assets/ticker/preview?ticker=TSLA
func (h *handler) tickerPreview(c *gin.Context) {
	ticker := c.Query("ticker")
	if ticker == "" {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	quote, err := h.svc.GetTickerPreview(c.Request.Context(), ticker)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidTicker)
		return
	}

	apiModel.OK(c, "ticker preview", quote)
}

// ─── Asset CRUD ───────────────────────────────────────────────────────────────

// create godoc
//
//	@Summary	Add an asset to a portfolio (ticker or manual, with lots)
//	@Tags		assets
//	@Accept		json
//	@Produce	json
//	@Param		portfolioID	path		string					true	"Portfolio ID"
//	@Param		body		body		model.CreateAssetRequest	true	"Asset + lots"
//	@Success	201			{object}	model.Asset
//	@Router		/portfolios/{portfolioID}/assets [post]
func (h *handler) create(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}

	var req model.CreateAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	asset, err := h.svc.Create(c.Request.Context(), portfolioID, callerID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.Created(c, messages.AssetCreated, asset)
}

// list godoc
//
//	@Summary	List assets in a portfolio
//	@Tags		assets
//	@Produce	json
//	@Param		portfolioID	path		string	true	"Portfolio ID"
//	@Success	200			{array}		model.Asset
//	@Router		/portfolios/{portfolioID}/assets [get]
func (h *handler) list(c *gin.Context) {
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}

	assets, err := h.svc.ListByPortfolio(c.Request.Context(), portfolioID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "assets", assets)
}

// get godoc
//
//	@Summary	Get an asset by ID (with lots)
//	@Tags		assets
//	@Produce	json
//	@Param		portfolioID	path		string	true	"Portfolio ID"
//	@Param		id			path		string	true	"Asset ID"
//	@Success	200			{object}	model.Asset
//	@Router		/portfolios/{portfolioID}/assets/{id} [get]
func (h *handler) get(c *gin.Context) {
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}

	asset, err := h.svc.GetByID(c.Request.Context(), assetID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "asset", asset)
}

// update godoc
//
//	@Summary	Update an asset
//	@Tags		assets
//	@Accept		json
//	@Produce	json
//	@Param		portfolioID	path		string					true	"Portfolio ID"
//	@Param		id			path		string					true	"Asset ID"
//	@Param		body		body		model.UpdateAssetRequest	true	"Fields to update"
//	@Success	200			{object}	model.Asset
//	@Router		/portfolios/{portfolioID}/assets/{id} [patch]
func (h *handler) update(c *gin.Context) {
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}

	var req model.UpdateAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	updated, err := h.svc.Update(c.Request.Context(), assetID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.AssetUpdated, updated)
}

// delete godoc
//
//	@Summary	Delete an asset
//	@Tags		assets
//	@Produce	json
//	@Param		portfolioID	path	string	true	"Portfolio ID"
//	@Param		id			path	string	true	"Asset ID"
//	@Success	200			{object}	apiModel.APIResponse
//	@Router		/portfolios/{portfolioID}/assets/{id} [delete]
func (h *handler) delete(c *gin.Context) {
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}

	if err := h.svc.Delete(c.Request.Context(), assetID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.AssetDeleted, nil)
}

// ─── Lot handlers ─────────────────────────────────────────────────────────────

// listLots returns all purchase lots for an asset.
func (h *handler) listLots(c *gin.Context) {
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}

	lots, err := h.svc.ListLots(c.Request.Context(), assetID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "lots", lots)
}

// addLot appends a new purchase lot to an existing asset.
func (h *handler) addLot(c *gin.Context) {
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}

	var req model.CreateLotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	lot, err := h.svc.AddLot(c.Request.Context(), assetID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.Created(c, "lot added", lot)
}

// deleteLot removes a purchase lot from an asset.
func (h *handler) deleteLot(c *gin.Context) {
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}

	lotID, err := uuid.Parse(c.Param("lotID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	if err := h.svc.DeleteLot(c.Request.Context(), assetID, lotID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "lot removed", nil)
}

// refreshPrice is kept as a placeholder for the background price sync endpoint.
func (h *handler) refreshPrice(c *gin.Context) { /* TODO */ }

// ─── Cash flow handlers ───────────────────────────────────────────────────────

// listCashFlows returns all cash flows for an asset, newest first.
func (h *handler) listCashFlows(c *gin.Context) {
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}

	flows, err := h.svc.ListCashFlows(c.Request.Context(), assetID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "cash flows", flows)
}

// addCashFlow records a new income or expense event for an asset.
func (h *handler) addCashFlow(c *gin.Context) {
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}

	var req model.CreateCashFlowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	flow, err := h.svc.AddCashFlow(c.Request.Context(), assetID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.Created(c, messages.CashFlowAdded, flow)
}

// deleteCashFlow removes a cash flow entry.
func (h *handler) deleteCashFlow(c *gin.Context) {
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}

	flowID, err := uuid.Parse(c.Param("flowID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	if err := h.svc.DeleteCashFlow(c.Request.Context(), assetID, flowID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.CashFlowDeleted, nil)
}

// ─── Value history handler ────────────────────────────────────────────────────

// listValueHistory returns value snapshots for an asset within an optional date range.
// Query params: from (RFC3339), to (RFC3339). Defaults to last 1 year.
func (h *handler) listValueHistory(c *gin.Context) {
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}

	now := time.Now().UTC()
	from := now.AddDate(-1, 0, 0)
	to := now

	if fromStr := c.Query("from"); fromStr != "" {
		if t, err := time.Parse(time.RFC3339, fromStr); err == nil {
			from = t
		}
	}
	if toStr := c.Query("to"); toStr != "" {
		if t, err := time.Parse(time.RFC3339, toStr); err == nil {
			to = t
		}
	}

	history, err := h.svc.ListValueHistory(c.Request.Context(), assetID, from, to)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "value history", history)
}
