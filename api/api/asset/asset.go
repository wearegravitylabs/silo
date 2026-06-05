// Package asset handles asset HTTP endpoints.
package asset

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appAsset "github.com/wearegravitylabs/silo/api/app/asset"
	appDocument "github.com/wearegravitylabs/silo/api/app/document"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/messages"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

const serviceName = "asset"

type handler struct {
	svc    appAsset.Asset
	docSvc appDocument.Document
}

// New registers asset routes under /portfolios/:portfolioID/assets.
// Portfolio role middleware is applied per sub-group — token validation happens
// upstream via the onboarded route group's RequireAuth + RequireOnboarded chain.
func New(r *gin.RouterGroup, svc appAsset.Asset, docSvc appDocument.Document, mid *middleware.Middleware) {
	h := &handler{svc: svc, docSvc: docSvc}
	g := r.Group("/portfolios/:portfolioID/assets")

	member := g.Group("", mid.RequirePortfolioMember())
	member.GET("/overview", h.overview)   // must come before /:id to avoid conflict
	member.GET("/ticker/search", h.tickerSearch)
	member.GET("/ticker/preview", h.tickerPreview)
	member.GET("", h.list)
	member.GET("/:id", h.get)
	member.GET("/:id/lots", h.listLots)
	member.GET("/:id/cash-flows", h.listCashFlows)
	member.GET("/:id/value-history", h.listValueHistory)
	// Documents — read
	member.GET("/:id/documents", h.listDocuments)
	member.GET("/:id/documents/:docID/download-url", h.documentDownloadURL)

	editor := g.Group("", mid.RequirePortfolioEditor())
	editor.POST("", h.create)
	editor.PATCH("/:id", h.update)
	editor.DELETE("/:id", h.delete)
	editor.POST("/:id/lots", h.addLot)
	editor.DELETE("/:id/lots/:lotID", h.deleteLot)
	editor.POST("/:id/cash-flows", h.addCashFlow)
	editor.DELETE("/:id/cash-flows/:flowID", h.deleteCashFlow)
	// Documents — write
	editor.POST("/:id/documents", h.uploadDocument)
	editor.DELETE("/:id/documents/:docID", h.deleteDocument)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// mustCallerID extracts the authenticated user ID from the request context.
// The JWT middleware must have already validated the token and injected this value.
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

// ─── Overview ────────────────────────────────────────────────────────────────

// overview returns aggregated asset metrics for the portfolio in its base_currency.
func (h *handler) overview(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}

	ov, err := h.svc.Overview(c.Request.Context(), portfolioID, callerID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "asset overview", ov)
}

// ─── Asset CRUD ───────────────────────────────────────────────────────────────

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

func (h *handler) list(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	// Bind optional filters from query params.
	// Repeated params are supported: ?class=stock&class=crypto
	var filter model.ListAssetsFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	assets, err := h.svc.ListByPortfolio(c.Request.Context(), portfolioID, callerID, filter)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "assets", assets)
}

func (h *handler) get(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}
	asset, err := h.svc.GetByID(c.Request.Context(), assetID, callerID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "asset", asset)
}

func (h *handler) update(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}
	var req model.UpdateAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	updated, err := h.svc.Update(c.Request.Context(), assetID, callerID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.AssetUpdated, updated)
}

func (h *handler) delete(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}
	if err := h.svc.Delete(c.Request.Context(), assetID, callerID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.AssetDeleted, nil)
}

// ─── Lot handlers ─────────────────────────────────────────────────────────────

func (h *handler) listLots(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}
	lots, err := h.svc.ListLots(c.Request.Context(), assetID, callerID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "lots", lots)
}

func (h *handler) addLot(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}
	var req model.CreateLotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	lot, err := h.svc.AddLot(c.Request.Context(), assetID, callerID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.Created(c, "lot added", lot)
}

func (h *handler) deleteLot(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}
	lotID, err := uuid.Parse(c.Param("lotID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	if err := h.svc.DeleteLot(c.Request.Context(), assetID, callerID, lotID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "lot removed", nil)
}

// ─── Cash flow handlers ───────────────────────────────────────────────────────

func (h *handler) listCashFlows(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}
	flows, err := h.svc.ListCashFlows(c.Request.Context(), assetID, callerID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "cash flows", flows)
}

func (h *handler) addCashFlow(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}
	var req model.CreateCashFlowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	flow, err := h.svc.AddCashFlow(c.Request.Context(), assetID, callerID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.Created(c, messages.CashFlowAdded, flow)
}

func (h *handler) deleteCashFlow(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}
	flowID, err := uuid.Parse(c.Param("flowID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	if err := h.svc.DeleteCashFlow(c.Request.Context(), assetID, callerID, flowID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.CashFlowDeleted, nil)
}

func (h *handler) listValueHistory(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
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

	history, err := h.svc.ListValueHistory(c.Request.Context(), assetID, callerID, from, to)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "value history", history)
}

// refreshPrice is kept as a placeholder for the background price sync endpoint.
func (h *handler) refreshPrice(c *gin.Context) { /* TODO */ }

// ─── Document handlers ────────────────────────────────────────────────────────

// uploadDocument accepts a multipart file, stores it in the private bucket,
// and returns the document metadata (no URL — use download-url to get access).
func (h *handler) uploadDocument(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 50<<20) // 50 MB
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	defer file.Close()

	doc, err := h.docSvc.UploadToAsset(
		c.Request.Context(), assetID, callerID, portfolioID,
		header.Filename, header.Header.Get("Content-Type"),
		file, header.Size,
	)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.Created(c, "document uploaded", doc)
}

// listDocuments returns metadata for all documents attached to an asset.
func (h *handler) listDocuments(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	assetID, ok := parseAssetID(c)
	if !ok {
		return
	}

	docs, err := h.docSvc.ListByAsset(c.Request.Context(), assetID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "documents", docs)
}

// documentDownloadURL generates a presigned URL valid for 1 hour.
func (h *handler) documentDownloadURL(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}

	docID, err := uuid.Parse(c.Param("docID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	resp, err := h.docSvc.DownloadURL(c.Request.Context(), docID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "download url", resp)
}

// deleteDocument removes the file from storage and soft-deletes the record.
func (h *handler) deleteDocument(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}

	docID, err := uuid.Parse(c.Param("docID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	if err := h.docSvc.Delete(c.Request.Context(), docID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "document deleted", nil)
}
