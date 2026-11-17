// Package vault handles vault HTTP endpoints.
package vault

import (
	"encoding/json"
	"mime/multipart"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appVault "github.com/wearegravitylabs/silo/api/app/vault"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/messages"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

const serviceName = "vault"

type handler struct{ svc appVault.Vault }

// New registers vault routes under /portfolios/:portfolioID/vault. Every
// route needs the vault section.
func New(r *gin.RouterGroup, svc appVault.Vault, mid *middleware.Middleware) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/vault", mid.RequireSection("vault"))
	owned := mid.RequireOwned(
		middleware.Owned{Param: "id", Table: "vault_documents", Column: "portfolio_id", ParentParam: "portfolioID"},
	)

	member := g.Group("", mid.RequirePortfolioMember(), owned)
	member.GET("/status", h.status)
	member.POST("/unlock", h.unlock)
	member.GET("/documents", h.listDocuments)
	member.GET("/documents/:id/download-url", h.downloadURL)

	editor := g.Group("", mid.RequirePortfolioEditor(), owned)
	editor.POST("/documents", h.upload)
	editor.PUT("/documents/:id/file", h.replaceFile)
	editor.DELETE("/documents/:id", h.deleteDocument)

	owner := g.Group("", mid.RequirePortfolioOwner())
	owner.POST("/password", h.setPassword)
	owner.POST("/password/change", h.changePassword)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func callerID(c *gin.Context) uuid.UUID {
	id, _ := c.Request.Context().Value(contexts.ContextKeyUserID).(uuid.UUID)
	return id
}

func portfolioID(c *gin.Context) uuid.UUID {
	id, _ := uuid.Parse(c.Param("portfolioID"))
	return id
}

func parseDocID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return uuid.Nil, false
	}
	return id, true
}

// readFile reads the multipart "file" field and the optional "encryption"
// field (a JSON object describing how the browser encrypted the file).
func readFile(c *gin.Context) (multipart.File, *multipart.FileHeader, model.JSONB, bool) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 50<<20) // 50 MB
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return nil, nil, nil, false
	}
	var enc model.JSONB
	if raw := c.Request.FormValue("encryption"); raw != "" {
		if err := json.Unmarshal([]byte(raw), &enc); err != nil {
			_ = file.Close()
			apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
			return nil, nil, nil, false
		}
	}
	return file, header, enc, true
}

// ─── Documents ────────────────────────────────────────────────────────────────

// upload stores a file (encrypted by the browser, or plain) in the private bucket.
func (h *handler) upload(c *gin.Context) {
	file, header, enc, ok := readFile(c)
	if !ok {
		return
	}
	defer file.Close()

	doc, err := h.svc.Upload(c.Request.Context(), callerID(c), portfolioID(c),
		header.Filename, header.Header.Get("Content-Type"), file, header.Size, enc)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.Created(c, messages.VaultDocumentUploaded, doc)
}

// replaceFile swaps a document's file, e.g. for its encrypted version.
func (h *handler) replaceFile(c *gin.Context) {
	docID, ok := parseDocID(c)
	if !ok {
		return
	}
	file, header, enc, ok := readFile(c)
	if !ok {
		return
	}
	defer file.Close()

	doc, err := h.svc.ReplaceFile(c.Request.Context(), docID, header.Header.Get("Content-Type"), file, header.Size, enc)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "file replaced", doc)
}

// listDocuments returns metadata for all vault documents in a portfolio.
func (h *handler) listDocuments(c *gin.Context) {
	docs, err := h.svc.ListDocuments(c.Request.Context(), portfolioID(c))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "documents", docs)
}

// downloadURL generates a presigned URL valid for 1 hour.
func (h *handler) downloadURL(c *gin.Context) {
	docID, ok := parseDocID(c)
	if !ok {
		return
	}
	url, err := h.svc.PresignedDownloadURL(c.Request.Context(), docID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "download url", map[string]any{"url": url, "expires_in": 3600})
}

// deleteDocument removes the file from storage and soft-deletes the record.
func (h *handler) deleteDocument(c *gin.Context) {
	docID, ok := parseDocID(c)
	if !ok {
		return
	}
	if err := h.svc.Delete(c.Request.Context(), docID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.VaultDocumentDeleted, nil)
}

// ─── Password ────────────────────────────────────────────────────────────────

func (h *handler) status(c *gin.Context) {
	st, err := h.svc.Status(c.Request.Context(), portfolioID(c), callerID(c))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "vault status", st)
}

func (h *handler) setPassword(c *gin.Context) {
	var req model.SetVaultPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	if err := h.svc.SetPassword(c.Request.Context(), portfolioID(c), callerID(c), req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.Created(c, "vault password set", nil)
}

func (h *handler) unlock(c *gin.Context) {
	var req model.UnlockVaultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	res, err := h.svc.Unlock(c.Request.Context(), portfolioID(c), callerID(c), req.Verifier)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "vault unlocked", res)
}

func (h *handler) changePassword(c *gin.Context) {
	var req model.ChangeVaultPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	if err := h.svc.ChangePassword(c.Request.Context(), portfolioID(c), callerID(c), req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "vault password changed", nil)
}
