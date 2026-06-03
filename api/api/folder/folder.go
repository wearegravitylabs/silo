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
)

const serviceName = "folder"

type handler struct{ svc appFolder.Folder }

// New registers folder routes under /portfolios/:portfolioID/folders.
func New(r *gin.RouterGroup, svc appFolder.Folder) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/folders")
	g.POST("", h.create)
	g.GET("", h.list)
	g.PATCH("/:id", h.update)
	g.DELETE("/:id", h.delete)
	g.PUT("/reorder", h.reorder)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// callerID extracts the authenticated user's UUID from the request context.
// The JWT middleware must have already validated the token and injected this value.
func callerID(c *gin.Context) (uuid.UUID, bool) {
	id, ok := c.Request.Context().Value(contexts.ContextKeyUserID).(uuid.UUID)
	return id, ok
}

// ─── Handlers ────────────────────────────────────────────────────────────────

// create godoc
//
//	@Summary	Create a folder (Owner or Editor)
//	@Tags		folders
//	@Accept		json
//	@Produce	json
//	@Param		portfolioID	path		string					true	"Portfolio ID"
//	@Param		body		body		model.CreateFolderRequest	true	"Folder details"
//	@Success	201			{object}	model.Folder
//	@Router		/portfolios/{portfolioID}/folders [post]
func (h *handler) create(c *gin.Context) {
	userID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
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

	folder, err := h.svc.Create(c.Request.Context(), portfolioID, userID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.Created(c, messages.FolderCreated, folder)
}

// list godoc
//
//	@Summary	List folders in a portfolio (any member)
//	@Tags		folders
//	@Produce	json
//	@Param		portfolioID	path		string	true	"Portfolio ID"
//	@Success	200			{array}		model.Folder
//	@Router		/portfolios/{portfolioID}/folders [get]
func (h *handler) list(c *gin.Context) {
	userID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
		return
	}

	portfolioID, err := uuid.Parse(c.Param("portfolioID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	folders, err := h.svc.List(c.Request.Context(), portfolioID, userID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "folders", folders)
}

// update godoc
//
//	@Summary	Update a folder (Owner or Editor)
//	@Tags		folders
//	@Accept		json
//	@Produce	json
//	@Param		portfolioID	path		string					true	"Portfolio ID"
//	@Param		id			path		string					true	"Folder ID"
//	@Param		body		body		model.UpdateFolderRequest	true	"Fields to update"
//	@Success	200			{object}	model.Folder
//	@Router		/portfolios/{portfolioID}/folders/{id} [patch]
func (h *handler) update(c *gin.Context) {
	userID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
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

	updated, err := h.svc.Update(c.Request.Context(), folderID, userID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.FolderUpdated, updated)
}

// delete godoc
//
//	@Summary	Delete a folder — assets inside become folder-less (Owner or Editor)
//	@Tags		folders
//	@Produce	json
//	@Param		portfolioID	path	string	true	"Portfolio ID"
//	@Param		id			path	string	true	"Folder ID"
//	@Success	200			{object}	apiModel.APIResponse
//	@Router		/portfolios/{portfolioID}/folders/{id} [delete]
func (h *handler) delete(c *gin.Context) {
	userID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
		return
	}

	folderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	if err := h.svc.Delete(c.Request.Context(), folderID, userID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.FolderDeleted, nil)
}

// reorder godoc
//
//	@Summary	Reorder all folders in a portfolio (Owner or Editor)
//	@Tags		folders
//	@Accept		json
//	@Produce	json
//	@Param		portfolioID	path		string						true	"Portfolio ID"
//	@Param		body		body		model.ReorderFoldersRequest	true	"New ordering"
//	@Success	200			{object}	apiModel.APIResponse
//	@Router		/portfolios/{portfolioID}/folders/reorder [put]
func (h *handler) reorder(c *gin.Context) {
	userID, ok := callerID(c)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
		return
	}

	portfolioID, err := uuid.Parse(c.Param("portfolioID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	var req model.ReorderFoldersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	if err := h.svc.Reorder(c.Request.Context(), portfolioID, userID, req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, messages.FoldersReordered, nil)
}
