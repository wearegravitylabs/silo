// Package env defines environment variable key constants used throughout the application.
package env

const (
	// Server
	ServerPort         = "SERVER_PORT"
	CORSAllowedOrigins = "CORS_ALLOWED_ORIGINS"
	AppEnv             = "APP_ENV"

	// JWT
	JWTSigningSecret      = "JWT_SIGNING_SECRET"
	JWTAccessTokenExpiry  = "JWT_ACCESS_TOKEN_EXPIRY"  // duration string e.g. "15m"
	JWTRefreshTokenExpiry = "JWT_REFRESH_TOKEN_EXPIRY" // e.g. "30d"

	// OTP
	OTPExpiry = "OTP_EXPIRY" // duration string e.g. "10m"

	// Encryption
	EncryptionKey = "ENCRYPTION_KEY" // 32-byte hex-encoded key for AES-256

	// Database (PostgreSQL)
	PGAddress  = "PG_ADDRESS"
	PGPort     = "PG_PORT"
	PGUser     = "PG_USER"
	PGPassword = "PG_PASSWORD"
	PGDatabase = "PG_DATABASE"
	PGSSLMode  = "PG_SSL_MODE"

	// Redis
	RedisURL = "REDIS_URL"

	// Market data
	YahooFinanceBaseURL = "YAHOO_FINANCE_BASE_URL"
	CoinGeckoAPIKey     = "COINGECKO_API_KEY"
	CoinGeckoBaseURL    = "COINGECKO_BASE_URL"
	ExchangeRateAPIKey  = "EXCHANGERATE_API_KEY"
	ExchangeRateBaseURL = "EXCHANGERATE_BASE_URL"

	// AI (Anthropic Claude)
	AnthropicAPIKey = "ANTHROPIC_API_KEY"
	ClaudeModel     = "CLAUDE_MODEL" // e.g. "claude-sonnet-4-6"

	// Object storage (S3 / MinIO)
	MinIOEndpoint  = "MINIO_ENDPOINT"
	MinIOAccessKey = "MINIO_ACCESS_KEY"
	MinIOSecretKey = "MINIO_SECRET_KEY"
	MinIOBucket    = "MINIO_BUCKET"
	MinIOUseSSL    = "MINIO_USE_SSL"

	// Email (Resend)
	ResendAPIKey    = "RESEND_API_KEY"
	ResendFromEmail = "RESEND_FROM_EMAIL"
	ResendFromName  = "RESEND_FROM_NAME"
	SupportEmail    = "SUPPORT_EMAIL"
	AppBaseURL      = "APP_BASE_URL"

	// Feature flags
	IsSandboxMode = "IS_SANDBOX_MODE"
)
