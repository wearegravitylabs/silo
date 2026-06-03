// Package model defines shared HTTP request/response types.
package model

import (
	"net/http"

	"github.com/gin-gonic/gin"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
)

// APIResponse is the standard envelope for all API responses.
type APIResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Data    any    `json:"data,omitempty"`
	Error   *ErrorData `json:"error,omitempty"`
}

// ErrorData carries structured error details in a failure response.
type ErrorData struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// OK writes a 200 response with the given data.
func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, APIResponse{Success: true, Data: data})
}

// Created writes a 201 response with the given data.
func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, APIResponse{Success: true, Data: data})
}

// NoContent writes a 204 response.
func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// HandleErrorResponse maps application errors to appropriate HTTP status codes.
func HandleErrorResponse(c *gin.Context, err error) {
	t, ok := err.(*siloErrors.TranslatableError)
	if !ok {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   &ErrorData{Code: "INTERNAL_ERROR", Message: "an unexpected error occurred"},
		})
		return
	}

	status := codeToHTTPStatus(t.Code)
	msg := "an error occurred"
	if t.Public {
		msg = t.Message
	}

	c.JSON(status, APIResponse{
		Success: false,
		Error:   &ErrorData{Code: t.Code, Message: msg},
	})
}

func codeToHTTPStatus(code string) int {
	switch code {
	case siloErrors.ErrUnauthorized.Code, siloErrors.ErrInvalidToken.Code, siloErrors.ErrInvalidOTP.Code:
		return http.StatusUnauthorized
	case siloErrors.ErrInsufficientPermission.Code:
		return http.StatusForbidden
	case siloErrors.ErrRecordNotFound.Code,
		siloErrors.ErrUserNotFound.Code,
		siloErrors.ErrPortfolioNotFound.Code,
		siloErrors.ErrAssetNotFound.Code,
		siloErrors.ErrDebtNotFound.Code:
		return http.StatusNotFound
	case siloErrors.ErrDuplicateRecord.Code,
		siloErrors.ErrUserEmailExists.Code,
		siloErrors.ErrMemberAlreadyExists.Code:
		return http.StatusConflict
	case siloErrors.ErrInvalidRequest.Code,
		siloErrors.ErrInvalidAssetType.Code,
		siloErrors.ErrInvalidDebtType.Code,
		siloErrors.ErrFileTooLarge.Code,
		siloErrors.ErrUnsupportedFileType.Code:
		return http.StatusBadRequest
	case siloErrors.ErrAccountLocked.Code, siloErrors.ErrVaultLocked.Code:
		return http.StatusTooManyRequests
	default:
		return http.StatusInternalServerError
	}
}
