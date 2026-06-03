-- +goose Up
-- +goose StatementBegin

-- Drop legacy password / lock columns from users
ALTER TABLE users
    DROP COLUMN IF EXISTS password,
    DROP COLUMN IF EXISTS is_active,
    DROP COLUMN IF EXISTS email_otp_code,
    DROP COLUMN IF EXISTS email_otp_expiry,
    DROP COLUMN IF EXISTS reset_pw_otp_code,
    DROP COLUMN IF EXISTS reset_pw_otp_expiry,
    DROP COLUMN IF EXISTS failed_login_attempts,
    DROP COLUMN IF EXISTS locked_until;

-- Add OTP columns for magic-link authentication
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS otp_code   TEXT,
    ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP WITH TIME ZONE;

-- Refresh tokens — opaque tokens issued on successful OTP verification
CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens (user_id);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE IF EXISTS refresh_tokens;

ALTER TABLE users
    DROP COLUMN IF EXISTS otp_code,
    DROP COLUMN IF EXISTS otp_expiry;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password              TEXT,
    ADD COLUMN IF NOT EXISTS is_active             BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS email_otp_code        VARCHAR(100),
    ADD COLUMN IF NOT EXISTS email_otp_expiry      TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS reset_pw_otp_code     VARCHAR(100),
    ADD COLUMN IF NOT EXISTS reset_pw_otp_expiry   TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until          TIMESTAMP WITH TIME ZONE;

-- +goose StatementEnd
