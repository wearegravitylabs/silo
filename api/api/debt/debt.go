// Package debt handles debt HTTP endpoints.
package debt

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appDebt "github.com/wearegravitylabs/silo/api/app/debt"
	appDocument "github.com/wearegravitylabs/silo/api/app/document"
	appNote "github.com/wearegravitylabs/silo/api/app/note"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/messages"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

const serviceName = "debt"

type handler struct {
	svc     appDebt.Debt
	noteSvc appNote.Note
	docSvc  appDocument.Document
}

// New registers debt routes under /portfolios/:portfolioID/debts.
func New(r *gin.RouterGroup, svc appDebt.Debt, noteSvc appNote.Note, docSvc appDocument.Document, mid *middleware.Middleware) {
	h := &handler{svc: svc, noteSvc: noteSvc, docSvc: docSvc}
	g := r.Group("/portfolios/:portfolioID/debts")

	member := g.Group("", mid.RequirePortfolioMember())
	member.GET("", h.list)
	member.GET("/:id", h.get)
	member.GET("/:id/amortization", h.amortizationSchedule)
	// Notes — read
	member.GET("/:id/notes", h.listNotes)
	// Documents — read
	member.GET("/:id/documents", h.listDocuments)
	member.GET("/:id/documents/:docID/download-url", h.documentDownloadURL)

	editor := g.Group("", mid.RequirePortfolioEditor())
	editor.POST("", h.create)
	editor.PATCH("/:id", h.update)
	editor.DELETE("/:id", h.delete)
	// Notes — write
	editor.POST("/:id/notes", h.addNote)
	editor.PATCH("/:id/notes/:noteID", h.updateNote)
	editor.DELETE("/:id/notes/:noteID", h.deleteNote)
	// Documents — write
	editor.POST("/:id/documents", h.uploadDocument)
	editor.DELETE("/:id/documents/:docID", h.deleteDocument)
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

func parseDebtID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return uuid.Nil, false
	}
	return id, true
}

// ─── Debt CRUD ────────────────────────────────────────────────────────────────

func (h *handler) create(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	var req model.CreateDebtRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	debt, err := h.svc.Create(c.Request.Context(), portfolioID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.Created(c, messages.DebtCreated, debt)
}

func (h *handler) list(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	var filter model.ListDebtsFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	debts, err := h.svc.ListByPortfolio(c.Request.Context(), portfolioID, filter)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "debts", debts)
}

func (h *handler) get(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	debtID, ok := parseDebtID(c)
	if !ok {
		return
	}
	debt, err := h.svc.GetByID(c.Request.Context(), debtID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "debt", debt)
}

func (h *handler) update(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	debtID, ok := parseDebtID(c)
	if !ok {
		return
	}
	var req model.UpdateDebtRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	debt, err := h.svc.Update(c.Request.Context(), debtID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.DebtUpdated, debt)
}

func (h *handler) delete(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	debtID, ok := parseDebtID(c)
	if !ok {
		return
	}
	if err := h.svc.Delete(c.Request.Context(), debtID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.DebtDeleted, nil)
}

func (h *handler) amortizationSchedule(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	debtID, ok := parseDebtID(c)
	if !ok {
		return
	}
	schedule, err := h.svc.AmortizationSchedule(c.Request.Context(), debtID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "amortization schedule", schedule)
}

// ─── Note handlers ────────────────────────────────────────────────────────────

func (h *handler) listNotes(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	debtID, ok := parseDebtID(c)
	if !ok {
		return
	}
	notes, err := h.noteSvc.ListByDebt(c.Request.Context(), debtID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "notes", notes)
}

func (h *handler) addNote(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	debtID, ok := parseDebtID(c)
	if !ok {
		return
	}
	var req model.CreateNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	note, err := h.noteSvc.AddToDebt(c.Request.Context(), debtID, callerID, portfolioID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.Created(c, messages.NoteAdded, note)
}

func (h *handler) updateNote(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	noteID, err := uuid.Parse(c.Param("noteID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	var req model.UpdateNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	note, err := h.noteSvc.Update(c.Request.Context(), noteID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.NoteUpdated, note)
}

func (h *handler) deleteNote(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	noteID, err := uuid.Parse(c.Param("noteID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	if err := h.noteSvc.Delete(c.Request.Context(), noteID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.NoteDeleted, nil)
}

// ─── Document handlers ────────────────────────────────────────────────────────

func (h *handler) listDocuments(c *gin.Context) {
	_, ok := mustCallerID(c)
	if !ok {
		return
	}
	debtID, ok := parseDebtID(c)
	if !ok {
		return
	}
	docs, err := h.docSvc.ListByDebt(c.Request.Context(), debtID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "documents", docs)
}

func (h *handler) uploadDocument(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	debtID, ok := parseDebtID(c)
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

	doc, err := h.docSvc.UploadToDebt(
		c.Request.Context(), debtID, callerID, portfolioID,
		header.Filename, header.Header.Get("Content-Type"),
		file, header.Size,
	)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.Created(c, messages.DocumentUploaded, doc)
}

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
	apiModel.OK(c, messages.DocumentDeleted, nil)
}
