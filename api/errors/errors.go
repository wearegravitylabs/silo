// Package errors defines all application errors with machine-readable codes.
//
// Errors marked Public: true are safe to surface directly to API clients.
// Their Message field must reference a constant from pkg/messages so that
// all user-facing copy lives in one place.
//
// Errors without Public: true are for internal/logging use only — their Message
// fields are kept terse and are never sent to clients.
package errors

import (
	"fmt"

	"github.com/wearegravitylabs/silo/api/pkg/messages"
)

// TranslatableError is an application error with a machine-readable code.
// When Public is true the Message is safe to include in API responses.
type TranslatableError struct {
	Code    string
	Key     string
	Message string
	Args    []any
	Public  bool
}

// Error implements the error interface.
func (e *TranslatableError) Error() string { return e.Message }

// NewTranslatableError creates a new TranslatableError with a formatted message.
func NewTranslatableError(code, key, message string, args ...any) *TranslatableError {
	return &TranslatableError{Code: code, Key: key, Message: fmt.Sprintf(message, args...), Args: args}
}

// IsNotFound reports whether err represents a missing-record condition.
func IsNotFound(err error) bool {
	t, ok := err.(*TranslatableError)
	return ok && t.Code == ErrRecordNotFound.Code
}

var (
	// ─── Generic ─────────────────────────────────────────────────────────────

	// ErrGenericErr is the fallback for unexpected internal failures. Never Public.
	ErrGenericErr = &TranslatableError{Code: "GENERIC_ERROR", Key: "ERR_GENERIC",
		Message: "an unexpected error occurred"}

	// ErrRecordNotFound is used when a DB lookup returns no rows. Never Public.
	ErrRecordNotFound = &TranslatableError{Code: "RECORD_NOT_FOUND", Key: "ERR_RECORD_NOT_FOUND",
		Message: "record not found"}

	// ErrDuplicateRecord is used when a unique constraint is violated. Never Public.
	ErrDuplicateRecord = &TranslatableError{Code: "DUPLICATE_RECORD", Key: "ERR_DUPLICATE_RECORD",
		Message: "record already exists"}

	// ErrInvalidRequest is shown when request binding or validation fails.
	ErrInvalidRequest = &TranslatableError{Code: "INVALID_REQUEST", Key: "ERR_INVALID_REQUEST",
		Message: messages.ErrInvalidRequest, Public: true}

	// ─── Auth ─────────────────────────────────────────────────────────────────

	// ErrUnauthorized is shown when no valid session exists.
	ErrUnauthorized = &TranslatableError{Code: "UNAUTHORIZED", Key: "ERR_UNAUTHORIZED",
		Message: messages.ErrUnauthorized, Public: true}

	// ErrInvalidToken is shown when a JWT is missing, malformed, or expired.
	ErrInvalidToken = &TranslatableError{Code: "INVALID_TOKEN", Key: "ERR_INVALID_TOKEN",
		Message: messages.ErrInvalidToken, Public: true}

	// ErrEmailNotVerified is shown when an action requires a verified email.
	ErrEmailNotVerified = &TranslatableError{Code: "EMAIL_NOT_VERIFIED", Key: "ERR_EMAIL_NOT_VERIFIED",
		Message: messages.ErrEmailNotVerified, Public: true}

	// ErrInvalidOTP is shown when the 6-digit sign-in code is wrong or expired.
	ErrInvalidOTP = &TranslatableError{Code: "INVALID_OTP", Key: "ERR_INVALID_OTP",
		Message: messages.ErrInvalidOTP, Public: true}

	// ErrAccountLocked is shown after repeated failed sign-in attempts.
	ErrAccountLocked = &TranslatableError{Code: "ACCOUNT_LOCKED", Key: "ERR_ACCOUNT_LOCKED",
		Message: messages.ErrAccountLocked, Public: true}

	// ─── User ─────────────────────────────────────────────────────────────────

	// ErrUserNotFound is an internal error — never shown to clients directly.
	ErrUserNotFound = &TranslatableError{Code: "USER_NOT_FOUND", Key: "ERR_USER_NOT_FOUND",
		Message: "user not found"}

	// ErrUserEmailExists is shown on duplicate email registration.
	ErrUserEmailExists = &TranslatableError{Code: "USER_EMAIL_EXISTS", Key: "ERR_USER_EMAIL_EXISTS",
		Message: messages.ErrEmailAlreadyExists, Public: true}

	// ─── Portfolio ────────────────────────────────────────────────────────────

	// ErrPortfolioNotFound is an internal error.
	ErrPortfolioNotFound = &TranslatableError{Code: "PORTFOLIO_NOT_FOUND", Key: "ERR_PORTFOLIO_NOT_FOUND",
		Message: "portfolio not found"}

	// ErrInsufficientPermission is shown when a user lacks the required role.
	ErrInsufficientPermission = &TranslatableError{Code: "INSUFFICIENT_PERMISSION", Key: "ERR_INSUFFICIENT_PERMISSION",
		Message: messages.ErrNoPermission, Public: true}

	// ErrMemberAlreadyExists is shown when the invited user already has access.
	ErrMemberAlreadyExists = &TranslatableError{Code: "MEMBER_ALREADY_EXISTS", Key: "ERR_MEMBER_ALREADY_EXISTS",
		Message: messages.ErrMemberAlreadyExists, Public: true}

	// ErrLastOwner is shown when trying to remove the last owner of a portfolio.
	ErrLastOwner = &TranslatableError{Code: "LAST_OWNER", Key: "ERR_LAST_OWNER",
		Message: messages.ErrLastOwner, Public: true}

	// ErrInvalidCurrency is shown when an unsupported currency code is submitted.
	ErrInvalidCurrency = &TranslatableError{Code: "INVALID_CURRENCY", Key: "ERR_INVALID_CURRENCY",
		Message: messages.ErrInvalidCurrency, Public: true}

	// ErrInviteeNotFound is shown when the invited email has no Silo account.
	ErrInviteeNotFound = &TranslatableError{Code: "INVITEE_NOT_FOUND", Key: "ERR_INVITEE_NOT_FOUND",
		Message: messages.ErrInviteeNotFound, Public: true}

	// ─── Asset ────────────────────────────────────────────────────────────────

	// ErrAssetNotFound is an internal error.
	ErrAssetNotFound = &TranslatableError{Code: "ASSET_NOT_FOUND", Key: "ERR_ASSET_NOT_FOUND",
		Message: "asset not found"}

	// ErrInvalidAssetType is shown when an unsupported asset_type is submitted.
	ErrInvalidAssetType = &TranslatableError{Code: "INVALID_ASSET_TYPE", Key: "ERR_INVALID_ASSET_TYPE",
		Message: messages.ErrInvalidAssetType, Public: true}

	// ErrInvalidTicker is shown when a stock or crypto ticker cannot be resolved.
	ErrInvalidTicker = &TranslatableError{Code: "INVALID_TICKER", Key: "ERR_INVALID_TICKER",
		Message: messages.ErrTickerNotFound, Public: true}

	// ─── Debt ─────────────────────────────────────────────────────────────────

	// ErrDebtNotFound is an internal error.
	ErrDebtNotFound = &TranslatableError{Code: "DEBT_NOT_FOUND", Key: "ERR_DEBT_NOT_FOUND",
		Message: "debt not found"}

	// ErrInvalidDebtType is shown when an unsupported debt_type is submitted.
	ErrInvalidDebtType = &TranslatableError{Code: "INVALID_DEBT_TYPE", Key: "ERR_INVALID_DEBT_TYPE",
		Message: messages.ErrInvalidDebtType, Public: true}

	// ─── Auto-Pilot ───────────────────────────────────────────────────────────

	// ErrAutopilotRuleNotFound is an internal error.
	ErrAutopilotRuleNotFound = &TranslatableError{Code: "AUTOPILOT_RULE_NOT_FOUND", Key: "ERR_AUTOPILOT_RULE_NOT_FOUND",
		Message: "autopilot rule not found"}

	// ─── Folder ───────────────────────────────────────────────────────────────

	// ErrFolderNotFound is shown when a folder ID does not exist or is inaccessible.
	ErrFolderNotFound = &TranslatableError{Code: "FOLDER_NOT_FOUND", Key: "ERR_FOLDER_NOT_FOUND",
		Message: messages.ErrFolderNotFound, Public: true}

	// ─── Vault ────────────────────────────────────────────────────────────────

	// ErrVaultDecryptFailed is shown when the client-side decryption password is wrong.
	ErrVaultDecryptFailed = &TranslatableError{Code: "VAULT_DECRYPT_FAILED", Key: "ERR_VAULT_DECRYPT_FAILED",
		Message: messages.ErrVaultPasswordIncorrect, Public: true}

	// ErrVaultLocked is shown after too many failed Vault unlock attempts.
	ErrVaultLocked = &TranslatableError{Code: "VAULT_LOCKED", Key: "ERR_VAULT_LOCKED",
		Message: messages.ErrVaultLocked, Public: true}

	// ─── Market Data ──────────────────────────────────────────────────────────

	// ErrMarketDataUnavailable is an internal error used when price APIs are down.
	ErrMarketDataUnavailable = &TranslatableError{Code: "MARKET_DATA_UNAVAILABLE", Key: "ERR_MARKET_DATA_UNAVAILABLE",
		Message: "market data is temporarily unavailable"}

	// ─── Storage ──────────────────────────────────────────────────────────────

	// ErrStorageUploadFailed is an internal error.
	ErrStorageUploadFailed = &TranslatableError{Code: "STORAGE_UPLOAD_FAILED", Key: "ERR_STORAGE_UPLOAD_FAILED",
		Message: "file upload failed"}

	// ErrStorageDownloadFailed is an internal error.
	ErrStorageDownloadFailed = &TranslatableError{Code: "STORAGE_DOWNLOAD_FAILED", Key: "ERR_STORAGE_DOWNLOAD_FAILED",
		Message: "file download failed"}

	// ErrFileTooLarge is shown when an upload exceeds the size limit.
	ErrFileTooLarge = &TranslatableError{Code: "FILE_TOO_LARGE", Key: "ERR_FILE_TOO_LARGE",
		Message: messages.ErrFileTooLarge, Public: true}

	// ErrUnsupportedFileType is shown when the uploaded MIME type is not allowed.
	ErrUnsupportedFileType = &TranslatableError{Code: "UNSUPPORTED_FILE_TYPE", Key: "ERR_UNSUPPORTED_FILE_TYPE",
		Message: messages.ErrUnsupportedFileType, Public: true}
)
