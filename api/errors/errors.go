// Package errors defines all application errors with machine-readable codes.
package errors

import "fmt"

// TranslatableError is an error type with a machine-readable code and an optional
// public flag indicating it is safe to surface directly to API clients.
type TranslatableError struct {
	Code    string
	Key     string
	Message string
	Args    []any
	Public  bool
}

func (e *TranslatableError) Error() string { return e.Message }

// NewTranslatableError creates a new TranslatableError.
func NewTranslatableError(code, key, message string, args ...any) *TranslatableError {
	return &TranslatableError{Code: code, Key: key, Message: fmt.Sprintf(message, args...), Args: args}
}

// IsNotFound returns true if the error indicates a missing record.
func IsNotFound(err error) bool {
	t, ok := err.(*TranslatableError)
	return ok && t.Code == ErrRecordNotFound.Code
}

var (
	// Generic
	ErrGenericErr      = &TranslatableError{Code: "GENERIC_ERROR", Key: "ERR_GENERIC", Message: "an unexpected error occurred"}
	ErrRecordNotFound  = &TranslatableError{Code: "RECORD_NOT_FOUND", Key: "ERR_RECORD_NOT_FOUND", Message: "record not found"}
	ErrDuplicateRecord = &TranslatableError{Code: "DUPLICATE_RECORD", Key: "ERR_DUPLICATE_RECORD", Message: "record already exists"}
	ErrInvalidRequest  = &TranslatableError{Code: "INVALID_REQUEST", Key: "ERR_INVALID_REQUEST", Message: "invalid request", Public: true}

	// Auth
	ErrUnauthorized          = &TranslatableError{Code: "UNAUTHORIZED", Key: "ERR_UNAUTHORIZED", Message: "unauthorized", Public: true}
	ErrInvalidToken          = &TranslatableError{Code: "INVALID_TOKEN", Key: "ERR_INVALID_TOKEN", Message: "invalid or expired token", Public: true}
	ErrIncorrectLoginDetails = &TranslatableError{Code: "INCORRECT_LOGIN_DETAILS", Key: "ERR_INCORRECT_LOGIN_DETAILS", Message: "incorrect email or password", Public: true}
	ErrEmailNotVerified      = &TranslatableError{Code: "EMAIL_NOT_VERIFIED", Key: "ERR_EMAIL_NOT_VERIFIED", Message: "email address has not been verified", Public: true}
	ErrInvalidOTP            = &TranslatableError{Code: "INVALID_OTP", Key: "ERR_INVALID_OTP", Message: "invalid or expired OTP", Public: true}
	ErrAccountLocked         = &TranslatableError{Code: "ACCOUNT_LOCKED", Key: "ERR_ACCOUNT_LOCKED", Message: "account is temporarily locked due to too many failed login attempts", Public: true}

	// User
	ErrUserNotFound     = &TranslatableError{Code: "USER_NOT_FOUND", Key: "ERR_USER_NOT_FOUND", Message: "user not found"}
	ErrUserEmailExists  = &TranslatableError{Code: "USER_EMAIL_EXISTS", Key: "ERR_USER_EMAIL_EXISTS", Message: "a user with this email already exists", Public: true}

	// Portfolio
	ErrPortfolioNotFound      = &TranslatableError{Code: "PORTFOLIO_NOT_FOUND", Key: "ERR_PORTFOLIO_NOT_FOUND", Message: "portfolio not found"}
	ErrInsufficientPermission = &TranslatableError{Code: "INSUFFICIENT_PERMISSION", Key: "ERR_INSUFFICIENT_PERMISSION", Message: "you do not have permission to perform this action", Public: true}
	ErrMemberAlreadyExists    = &TranslatableError{Code: "MEMBER_ALREADY_EXISTS", Key: "ERR_MEMBER_ALREADY_EXISTS", Message: "this user already has access to the portfolio", Public: true}

	// Asset
	ErrAssetNotFound    = &TranslatableError{Code: "ASSET_NOT_FOUND", Key: "ERR_ASSET_NOT_FOUND", Message: "asset not found"}
	ErrInvalidAssetType = &TranslatableError{Code: "INVALID_ASSET_TYPE", Key: "ERR_INVALID_ASSET_TYPE", Message: "invalid asset type", Public: true}
	ErrInvalidTicker    = &TranslatableError{Code: "INVALID_TICKER", Key: "ERR_INVALID_TICKER", Message: "ticker symbol not found", Public: true}

	// Debt
	ErrDebtNotFound    = &TranslatableError{Code: "DEBT_NOT_FOUND", Key: "ERR_DEBT_NOT_FOUND", Message: "debt not found"}
	ErrInvalidDebtType = &TranslatableError{Code: "INVALID_DEBT_TYPE", Key: "ERR_INVALID_DEBT_TYPE", Message: "invalid debt type", Public: true}

	// Autopilot
	ErrAutopilotRuleNotFound = &TranslatableError{Code: "AUTOPILOT_RULE_NOT_FOUND", Key: "ERR_AUTOPILOT_RULE_NOT_FOUND", Message: "autopilot rule not found"}

	// Vault
	ErrVaultDecryptFailed = &TranslatableError{Code: "VAULT_DECRYPT_FAILED", Key: "ERR_VAULT_DECRYPT_FAILED", Message: "vault decryption failed — check your vault password", Public: true}
	ErrVaultLocked        = &TranslatableError{Code: "VAULT_LOCKED", Key: "ERR_VAULT_LOCKED", Message: "vault is locked due to too many failed attempts", Public: true}

	// Market data
	ErrMarketDataUnavailable = &TranslatableError{Code: "MARKET_DATA_UNAVAILABLE", Key: "ERR_MARKET_DATA_UNAVAILABLE", Message: "market data is temporarily unavailable"}

	// Storage
	ErrStorageUploadFailed   = &TranslatableError{Code: "STORAGE_UPLOAD_FAILED", Key: "ERR_STORAGE_UPLOAD_FAILED", Message: "file upload failed"}
	ErrStorageDownloadFailed = &TranslatableError{Code: "STORAGE_DOWNLOAD_FAILED", Key: "ERR_STORAGE_DOWNLOAD_FAILED", Message: "file download failed"}
	ErrFileTooLarge          = &TranslatableError{Code: "FILE_TOO_LARGE", Key: "ERR_FILE_TOO_LARGE", Message: "file size exceeds the allowed limit", Public: true}
	ErrUnsupportedFileType   = &TranslatableError{Code: "UNSUPPORTED_FILE_TYPE", Key: "ERR_UNSUPPORTED_FILE_TYPE", Message: "file type is not supported", Public: true}
)
