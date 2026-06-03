// Package auth handles authentication HTTP endpoints.
package auth

import (
	"github.com/gin-gonic/gin"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appAuth "github.com/wearegravitylabs/silo/api/app/auth"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

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
//	@Summary	Request a sign-in code
//	@Tags		auth
//	@Accept		json
//	@Produce	json
//	@Param		body	body		model.SendCodeRequest	true	"Email address"
//	@Success	200		{object}	apiModel.APIResponse
//	@Router		/auth/send-code [post]
func (h *handler) sendCode(c *gin.Context) {
	var req model.SendCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, siloErrors.ErrInvalidRequest)
		return
	}
	if err := h.svc.SendCode(c.Request.Context(), req.Email); err != nil {
		apiModel.HandleErrorResponse(c, err)
		return
	}
	// Always return 200 with a generic message — don't reveal whether the email exists.
	apiModel.OK(c, gin.H{"message": "If that email is valid, a sign-in code is on its way."})
}

// verifyCode godoc
//
//	@Summary	Verify OTP and receive tokens
//	@Tags		auth
//	@Accept		json
//	@Produce	json
//	@Param		body	body		model.VerifyCodeRequest	true	"Email + 6-digit code"
//	@Success	200		{object}	model.AuthResponse
//	@Router		/auth/verify-code [post]
func (h *handler) verifyCode(c *gin.Context) {
	var req model.VerifyCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, siloErrors.ErrInvalidRequest)
		return
	}
	resp, err := h.svc.VerifyCode(c.Request.Context(), req.Email, req.Code)
	if err != nil {
		apiModel.HandleErrorResponse(c, err)
		return
	}
	apiModel.OK(c, resp)
}

// refreshToken godoc
//
//	@Summary	Exchange a refresh token for a new access token
//	@Tags		auth
//	@Accept		json
//	@Produce	json
//	@Param		body	body	model.RefreshTokenRequest	true	"Refresh token"
//	@Success	200		{object}	apiModel.APIResponse
//	@Router		/auth/refresh-token [post]
func (h *handler) refreshToken(c *gin.Context) {
	var req model.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiModel.HandleErrorResponse(c, siloErrors.ErrInvalidRequest)
		return
	}
	accessToken, err := h.svc.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		apiModel.HandleErrorResponse(c, err)
		return
	}
	apiModel.OK(c, gin.H{"access_token": accessToken})
}
