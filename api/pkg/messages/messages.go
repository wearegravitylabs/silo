// Package messages is the single source of truth for all user-facing strings in the
// Silo API — both success messages returned in response bodies and the public-safe
// copy used in error responses.
//
// Rules:
//   - Only strings that reach the client belong here.
//   - Internal/debugging messages stay in the errors package.
//   - Write in plain, friendly English. Avoid jargon and HTTP status language.
//   - Every error message should tell the user what happened and, where possible, what to do next.
package messages

// ─── Auth ────────────────────────────────────────────────────────────────────

// Success messages for the authentication flow.
const (
	// AuthCodeSent is returned by POST /auth/send-code.
	// Deliberately vague — never confirm whether an email address exists.
	AuthCodeSent = "If that email is valid, a sign-in code is on its way."
	// AuthSignedIn is returned by POST /auth/verify-code on success.
	AuthSignedIn = "You're signed in. Welcome to Silo."
	// AuthTokenRefreshed is returned by POST /auth/refresh-token on success.
	AuthTokenRefreshed = "Your session has been extended."
)

// Error messages for public-facing auth errors.
const (
	// ErrUnauthorized is shown when no valid session is present.
	ErrUnauthorized = "You're not signed in. Please sign in to continue."
	// ErrInvalidToken is shown when a JWT is missing, malformed, or expired.
	ErrInvalidToken = "Your session has expired. Please sign in again."
	// ErrInvalidOTP is shown when the 6-digit code is wrong or past its expiry window.
	ErrInvalidOTP = "The sign-in code is incorrect or has expired. Please request a new one."
	// ErrEmailNotVerified is shown when an action requires a verified email address.
	ErrEmailNotVerified = "Please verify your email address before continuing."
	// ErrNotOnboarded is shown when an action requires a completed onboarding profile.
	ErrNotOnboarded = "Please complete your profile setup before continuing."
	// ErrAccountLocked is shown after repeated failed sign-in attempts.
	ErrAccountLocked = "Your account has been temporarily locked. Please try again later."
)

// ─── User ─────────────────────────────────────────────────────────────────────

const (
	// UserProfileUpdated is returned when profile fields are saved.
	UserProfileUpdated = "Your profile has been updated."
	// UserAccountDeleted is returned when a user deletes their own account.
	UserAccountDeleted = "Your account has been deleted. We're sorry to see you go."
	// ErrEmailAlreadyExists is shown on duplicate email registration.
	ErrEmailAlreadyExists = "An account with this email address already exists."
)

// ─── Portfolio ────────────────────────────────────────────────────────────────

const (
	PortfolioCreated       = "Your portfolio has been created."
	PortfolioUpdated       = "Portfolio updated."
	PortfolioDeleted       = "Portfolio deleted."
	PortfolioMemberAdded   = "Member added to the portfolio."
	PortfolioMemberRemoved = "Access has been removed."

	// ErrNoPermission is shown when the authenticated user lacks the required role.
	ErrNoPermission = "You don't have permission to do that."
	// ErrMemberAlreadyExists is shown when trying to invite someone who already has access.
	ErrMemberAlreadyExists = "This person already has access to the portfolio."
	// ErrLastOwner is shown when trying to remove the only owner.
	ErrLastOwner = "You can't remove the last owner of a portfolio."
	// ErrInvalidCurrency is shown when base_currency is not in the supported list.
	ErrInvalidCurrency = "That's not a supported currency. Check the currencies list and try again."
	// ErrUserNotFound is shown when an invited email has no Silo account.
	ErrInviteeNotFound = "No Silo account found for that email address. Ask them to sign up first."
)

// ─── Assets ───────────────────────────────────────────────────────────────────

const (
	AssetCreated        = "Asset added to your portfolio."
	AssetUpdated        = "Asset updated."
	AssetDeleted        = "Asset removed from your portfolio."
	AssetPriceRefreshed = "Prices refreshed."

	// ErrInvalidAssetType is shown when an unsupported asset_type is submitted.
	ErrInvalidAssetType = "That's not a valid asset type. Please choose one of the supported types."
	// ErrTickerNotFound is shown when a stock or crypto ticker cannot be resolved.
	ErrTickerNotFound = "We couldn't find that ticker symbol. Please double-check and try again."
)

// ─── Debts ────────────────────────────────────────────────────────────────────

const (
	DebtCreated = "Debt added to your portfolio."
	DebtUpdated = "Debt updated."
	DebtDeleted = "Debt removed from your portfolio."

	// ErrInvalidDebtType is shown when an unsupported debt_type is submitted.
	ErrInvalidDebtType = "That's not a valid debt type. Please choose one of the supported types."
)

// ─── Auto-Pilot ───────────────────────────────────────────────────────────────

const (
	AutopilotRuleCreated = "Auto-Pilot rule is active."
	AutopilotRulePaused  = "Auto-Pilot rule paused."
	AutopilotRuleResumed = "Auto-Pilot rule resumed."
	AutopilotRuleDeleted = "Auto-Pilot rule removed."
)

// ─── Vault ────────────────────────────────────────────────────────────────────

const (
	VaultDocumentUploaded = "Document saved to your Vault."
	VaultDocumentDeleted  = "Document removed from your Vault."

	// ErrVaultPasswordIncorrect is shown when the client-side decryption password is wrong.
	ErrVaultPasswordIncorrect = "The Vault password is incorrect. Please try again."

	// ErrVaultLocked is shown after too many failed Vault unlock attempts.
	ErrVaultLocked = "Your Vault has been temporarily locked due to too many failed attempts. Please try again later."
)

// ─── Documents ────────────────────────────────────────────────────────────────

const (
	DocumentUploaded = "Document uploaded."
	DocumentDeleted  = "Document deleted."

	// ErrFileTooLarge is shown when an upload exceeds the size limit.
	ErrFileTooLarge = "That file is too large. Please upload a file smaller than the allowed limit."
	// ErrUnsupportedFileType is shown when the MIME type is not in the allow-list.
	ErrUnsupportedFileType = "That file type isn't supported. Accepted formats: PDF, DOCX, XLSX, PNG, JPG."
)

// ─── Folders ──────────────────────────────────────────────────────────────────

const (
	FolderCreated    = "Folder created."
	FolderUpdated    = "Folder updated."
	FolderDeleted    = "Folder deleted. Assets in this folder have been moved to the root."
	FoldersReordered = "Folders reordered."

	// ErrFolderNotFound is shown when the folder ID doesn't exist or the caller lacks access.
	ErrFolderNotFound = "That folder doesn't exist or you don't have access to it."
)

// ─── General ──────────────────────────────────────────────────────────────────

const (
	// ErrInvalidRequest is shown when request binding or validation fails.
	ErrInvalidRequest = "The request is missing required fields or contains invalid data. Please check and try again."
)
