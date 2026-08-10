// Package vault handles vault HTTP endpoints.
package vault

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appVault "github.com/wearegravitylabs/silo/api/app/vault"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/messages"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

const serviceName = "vault"

type handler struct{ svc appVault.Vault }

// New registers vault routes under /portfolios/:portfolioID/vault.
func New(r *gin.RouterGroup, svc appVault.Vault, mid *middleware.Middleware) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/vault")

	member := g.Group("", mid.RequirePortfolioMember())
	member.GET("/documents", h.listDocuments)
	member.GET("/documents/:id/download-url", h.downloadURL)

	editor := g.Group("", mid.RequirePortfolioEditor())
	editor.POST("/documents", h.upload)
	editor.DELETE("/documents/:id", h.deleteDocument)
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

func parseDocID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return uuid.Nil, false
	}
	return id, true
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

// upload accepts a multipart file, stores it in the private bucket,
// and returns the document metadata.
func (h *handler) upload(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
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

	doc, err := h.svc.Upload(
		c.Request.Context(),
		callerID, portfolioID,
		header.Filename, header.Header.Get("Content-Type"),
		file, header.Size,
	)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.Created(c, messages.VaultDocumentUploaded, doc)
}

// listDocuments returns metadata for all vault documents in a portfolio.
func (h *handler) listDocuments(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}

	docs, err := h.svc.ListDocuments(c.Request.Context(), callerID, portfolioID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "documents", docs)
}

// downloadURL generates a presigned URL valid for 1 hour.
func (h *handler) downloadURL(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	docID, ok := parseDocID(c)
	if !ok {
		return
	}

	url, err := h.svc.PresignedDownloadURL(c.Request.Context(), callerID, docID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "download url", map[string]any{
		"url":        url,
		"expires_in": 3600,
	})
}

// deleteDocument removes the file from storage and soft-deletes the record.
func (h *handler) deleteDocument(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	docID, ok := parseDocID(c)
	if !ok {
		return
	}

	if err := h.svc.Delete(c.Request.Context(), callerID, docID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.VaultDocumentDeleted, nil)
}
