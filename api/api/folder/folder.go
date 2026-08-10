// Package folder handles folder HTTP endpoints.
package folder

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appFolder "github.com/wearegravitylabs/silo/api/app/folder"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/messages"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

const serviceName = "folder"

type handler struct{ svc appFolder.Folder }

// New registers folder routes under /portfolios/:portfolioID/folders.
func New(r *gin.RouterGroup, svc appFolder.Folder, mid *middleware.Middleware) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/folders")

	g.GET("", mid.RequirePortfolioMember(), h.list)
	g.POST("", mid.RequirePortfolioEditor(), h.create)
	g.PATCH("/:id", mid.RequirePortfolioEditor(), h.update)
	g.DELETE("/:id", mid.RequirePortfolioEditor(), h.delete)
	g.PUT("/reorder", mid.RequirePortfolioEditor(), h.reorder)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func mustCallerID(c *gin.Context) (uuid.UUID, bool) {
	id, ok := c.Request.Context().Value(contexts.ContextKeyUserID).(uuid.UUID)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
	}
	return id, ok
}

// ─── Handlers ────────────────────────────────────────────────────────────────

func (h *handler) create(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, err := uuid.Parse(c.Param("portfolioID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	var req model.CreateFolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	folder, err := h.svc.Create(c.Request.Context(), portfolioID, callerID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.Created(c, messages.FolderCreated, folder)
}

func (h *handler) list(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, err := uuid.Parse(c.Param("portfolioID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	ft := model.FolderType(c.Query("type"))
	if ft != model.FolderTypeAsset && ft != model.FolderTypeDebt {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	folders, err := h.svc.List(c.Request.Context(), portfolioID, callerID, ft)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "folders", folders)
}

func (h *handler) update(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	folderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	var req model.UpdateFolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	updated, err := h.svc.Update(c.Request.Context(), folderID, callerID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.FolderUpdated, updated)
}

func (h *handler) delete(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	folderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	if err := h.svc.Delete(c.Request.Context(), folderID, callerID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.FolderDeleted, nil)
}

func (h *handler) reorder(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	portfolioID, err := uuid.Parse(c.Param("portfolioID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	var req model.ReorderFoldersRequest
	if err = c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	if err = h.svc.Reorder(c.Request.Context(), portfolioID, callerID, req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.FoldersReordered, nil)
}
