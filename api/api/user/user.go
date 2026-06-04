// Package user handles user profile HTTP endpoints.
package user

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appUser "github.com/wearegravitylabs/silo/api/app/user"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/messages"
)

const serviceName = "user"

type handler struct{ svc appUser.User }

// New registers user routes on the email-verified router group (Tier 2).
func New(r *gin.RouterGroup, svc appUser.User) {
	h := &handler{svc: svc}
	g := r.Group("/users")
	g.GET("/me", h.getMe)
	g.PATCH("/me", h.updateProfile)
	g.PATCH("/me/onboard", h.onboard)
	g.DELETE("/me", h.deleteAccount)
}

func mustCallerID(c *gin.Context) (uuid.UUID, bool) {
	id, ok := c.Request.Context().Value(contexts.ContextKeyUserID).(uuid.UUID)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
	}
	return id, ok
}

func (h *handler) getMe(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	user, err := h.svc.GetByID(c.Request.Context(), callerID)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "profile", user)
}

func (h *handler) updateProfile(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	var req model.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	updated, err := h.svc.UpdateProfile(c.Request.Context(), callerID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.UserProfileUpdated, updated)
}

func (h *handler) onboard(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	var req model.OnboardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	user, err := h.svc.Onboard(c.Request.Context(), callerID, req)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.UserOnboarded, user)
}

func (h *handler) deleteAccount(c *gin.Context) {
	callerID, ok := mustCallerID(c)
	if !ok {
		return
	}
	if err := h.svc.DeleteAccount(c.Request.Context(), callerID); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, messages.UserAccountDeleted, nil)
}
