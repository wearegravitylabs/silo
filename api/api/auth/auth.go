// Package auth handles authentication HTTP endpoints.
package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appAuth "github.com/wearegravitylabs/silo/api/app/auth"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

// serviceName is included in every error response to identify the originating domain.
const serviceName = "auth"

type handler struct{ svc appAuth.Auth }

// New registers auth routes on the given router group.
func New(r *gin.RouterGroup, svc appAuth.Auth) {
	h := &handler{svc: svc}
	g := r.Group("/auth")
	g.POST("/send-code", h.sendCode)
	g.POST("/verify-code", h.verifyCode)
	g.POST("/refresh-token", h.refreshToken)
}

// sendCode godoc
//
//	@Summary	Request a magic-link sign-in code
//	@Tags		auth
//	@Accept		json
//	@Produce	json
//	@Param		body	body		model.SendCodeRequest	true	"Email address"
//	@Success	200		{object}	apiModel.APIResponse
//	@Failure	400		{object}	apiModel.APIResponse
//	@Router		/auth/send-code [post]
func (h *handler) sendCode(c *gin.Context) {
	var req model.SendCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	if err := h.svc.SendCode(c.Request.Context(), req.Email); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	// Always respond with a generic message regardless of whether the email exists.
	// This prevents user enumeration: an attacker cannot tell from the response
	// whether an email address has a Silo account.
	c.JSON(http.StatusOK, apiModel.APIResponse{
		Code:    http.StatusOK,
		Data:    nil,
		Message: stringPtr("If that email is valid, a sign-in code is on its way."),
		Error:   nil,
	})
	c.Abort()
}

// verifyCode godoc
//
//	@Summary	Verify a 6-digit OTP and receive auth tokens
//	@Tags		auth
//	@Accept		json
//	@Produce	json
//	@Param		body	body		model.VerifyCodeRequest	true	"Email and 6-digit code"
//	@Success	200		{object}	model.AuthResponse
//	@Failure	401		{object}	apiModel.APIResponse
//	@Router		/auth/verify-code [post]
func (h *handler) verifyCode(c *gin.Context) {
	var req model.VerifyCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	resp, err := h.svc.VerifyCode(c.Request.Context(), req.Email, req.Code)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "signed in successfully", resp)
}

// refreshToken godoc
//
//	@Summary	Exchange a refresh token for a new access token
//	@Tags		auth
//	@Accept		json
//	@Produce	json
//	@Param		body	body		model.RefreshTokenRequest	true	"Opaque refresh token"
//	@Success	200		{object}	apiModel.APIResponse
//	@Failure	401		{object}	apiModel.APIResponse
//	@Router		/auth/refresh-token [post]
func (h *handler) refreshToken(c *gin.Context) {
	var req model.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}

	accessToken, err := h.svc.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}

	apiModel.OK(c, "token refreshed", map[string]string{"access_token": accessToken})
}

// stringPtr returns a pointer to s. Used inline to satisfy *string fields.
func stringPtr(s string) *string { return &s }
