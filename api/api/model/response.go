// Package model defines shared HTTP request/response types for the Silo API.
package model

import (
	"net/http"

	"github.com/gin-contrib/requestid"
	"github.com/gin-gonic/gin"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/pkg/helpers"
)

// APIResponse is the standard envelope for every API response — success and error alike.
// Clients should check whether Error is nil to determine the outcome.
type APIResponse struct {
	// Code mirrors the HTTP status in the body for clients that cannot easily inspect headers.
	Code int `json:"code"`
	// Data carries the payload on success; nil on error.
	Data any `json:"data"`
	// Message is a human-readable description of the outcome.
	Message *string `json:"message"`
	// Error is populated on failure and nil on success.
	Error *ErrorData `json:"error"`
}

// ErrorData carries structured error information returned on every failure response.
type ErrorData struct {
	// ID is the request ID from X-Request-ID — include it when reporting bugs.
	ID string `json:"id"`
	// Service identifies which handler domain generated the error (e.g. "auth", "portfolio").
	Service string `json:"service"`
	// Code is a machine-readable error identifier (e.g. "INVALID_OTP").
	Code string `json:"code"`
	// Message is a client-safe, human-readable description of the error.
	Message string `json:"message"`
}

// PageInfo carries pagination metadata for list responses.
type PageInfo struct {
	Page            int   `json:"page"`
	Size            int   `json:"size"`
	Total           int64 `json:"total"`
	HasNextPage     bool  `json:"has_next_page"`
	HasPreviousPage bool  `json:"has_previous_page"`
}

// PaginatedData wraps a list payload with its pagination metadata.
type PaginatedData struct {
	Items any      `json:"items"`
	Page  PageInfo `json:"page"`
}

// OK writes a 200 success response with an explicit message and data payload.
func OK(c *gin.Context, message string, data any) {
	c.JSON(http.StatusOK, APIResponse{
		Code:    http.StatusOK,
		Data:    data,
		Message: helpers.StringPtr(message),
		Error:   nil,
	})
	c.Abort()
}

// Created writes a 201 success response.
func Created(c *gin.Context, message string, data any) {
	c.JSON(http.StatusCreated, APIResponse{
		Code:    http.StatusCreated,
		Data:    data,
		Message: helpers.StringPtr(message),
		Error:   nil,
	})
	c.Abort()
}

// NoContent writes a 204 response with no body.
func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
	c.Abort()
}

// HandleErrorResponse maps an application error to the appropriate HTTP status and
// writes a structured error envelope. The request ID is extracted from the context
// automatically and embedded for traceability.
// serviceName should be the handler domain constant (e.g. "auth", "portfolio").
func HandleErrorResponse(c *gin.Context, serviceName string, err error) {
	t, ok := err.(*siloErrors.TranslatableError)
	if !ok {
		writeError(c, http.StatusInternalServerError, serviceName, "INTERNAL_ERROR", "an unexpected error occurred")
		return
	}

	status := codeToHTTPStatus(t.Code)

	// Only surface the specific error message when explicitly marked safe.
	// All other errors return the generic fallback to avoid leaking internals.
	clientMsg := "an error occurred"
	if t.Public {
		clientMsg = t.Message
	}

	writeError(c, status, serviceName, t.Code, clientMsg)
}

// writeError constructs and sends the error envelope.
func writeError(c *gin.Context, status int, serviceName, code, message string) {
	c.JSON(status, APIResponse{
		Code:    status,
		Data:    nil,
		Message: helpers.StringPtr("an error has occurred"),
		Error: &ErrorData{
			ID:      requestid.Get(c),
			Service: serviceName,
			Code:    code,
			Message: message,
		},
	})
	c.Abort()
}

// codeToHTTPStatus maps an application error code to an HTTP status code.
func codeToHTTPStatus(code string) int {
	switch code {
	case siloErrors.ErrUnauthorized.Code,
		siloErrors.ErrInvalidToken.Code,
		siloErrors.ErrInvalidOTP.Code,
		siloErrors.ErrEmailNotVerified.Code:
		return http.StatusUnauthorized

	case siloErrors.ErrInsufficientPermission.Code:
		return http.StatusForbidden

	case siloErrors.ErrRecordNotFound.Code,
		siloErrors.ErrUserNotFound.Code,
		siloErrors.ErrPortfolioNotFound.Code,
		siloErrors.ErrAssetNotFound.Code,
		siloErrors.ErrDebtNotFound.Code,
		siloErrors.ErrAutopilotRuleNotFound.Code:
		return http.StatusNotFound

	case siloErrors.ErrDuplicateRecord.Code,
		siloErrors.ErrUserEmailExists.Code,
		siloErrors.ErrMemberAlreadyExists.Code:
		return http.StatusConflict

	case siloErrors.ErrInvalidRequest.Code,
		siloErrors.ErrInvalidAssetType.Code,
		siloErrors.ErrInvalidDebtType.Code,
		siloErrors.ErrFileTooLarge.Code,
		siloErrors.ErrUnsupportedFileType.Code,
		siloErrors.ErrInvalidTicker.Code:
		return http.StatusBadRequest

	case siloErrors.ErrAccountLocked.Code,
		siloErrors.ErrVaultLocked.Code:
		return http.StatusTooManyRequests

	default:
		return http.StatusInternalServerError
	}
}
