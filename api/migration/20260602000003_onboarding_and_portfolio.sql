-- +goose Up
-- +goose StatementBegin

-- ─── Users — onboarding fields ───────────────────────────────────────────────

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone_number      VARCHAR(30),
    ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(10),  -- dial code, e.g. "+234"
    ADD COLUMN IF NOT EXISTS avatar_url         TEXT,
    ADD COLUMN IF NOT EXISTS is_onboarded       BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS portfolio_count    INT     NOT NULL DEFAULT 0;

-- ─── Portfolios — extra fields ───────────────────────────────────────────────

ALTER TABLE portfolios
    ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ─── Portfolio members — invitation tracking ──────────────────────────────────
-- invited_email lets us invite someone who doesn't have a Silo account yet.
-- Once they sign up and their email matches, the membership is activated.

ALTER TABLE portfolio_members
    ADD COLUMN IF NOT EXISTS invited_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS accepted_at   TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS status        VARCHAR(20) NOT NULL DEFAULT 'accepted';
    -- status: pending | accepted | declined

CREATE INDEX IF NOT EXISTS portfolio_members_invited_email_idx
    ON portfolio_members (invited_email)
    WHERE invited_email IS NOT NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE portfolio_members
    DROP COLUMN IF EXISTS invited_email,
    DROP COLUMN IF EXISTS accepted_at,
    DROP COLUMN IF EXISTS status;

ALTER TABLE portfolios
    DROP COLUMN IF EXISTS image_url;

ALTER TABLE users
    DROP COLUMN IF EXISTS phone_number,
    DROP COLUMN IF EXISTS phone_country_code,
    DROP COLUMN IF EXISTS avatar_url,
    DROP COLUMN IF EXISTS is_onboarded,
    DROP COLUMN IF EXISTS portfolio_count;

-- +goose StatementEnd
