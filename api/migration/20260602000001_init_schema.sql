-- +goose Up
-- +goose StatementBegin

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                 VARCHAR(255) NOT NULL,
    first_name            VARCHAR(255),
    last_name             VARCHAR(255),
    password              TEXT,
    is_active             BOOLEAN NOT NULL DEFAULT FALSE,
    is_email_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    email_otp_code        VARCHAR(100),
    email_otp_expiry      TIMESTAMP WITH TIME ZONE,
    reset_pw_otp_code     VARCHAR(100),
    reset_pw_otp_expiry   TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until          TIMESTAMP WITH TIME ZONE,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX users_email_uindex ON users (email) WHERE deleted_at IS NULL;

-- ─── Portfolios ───────────────────────────────────────────────────────────────

CREATE TABLE portfolios (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users (id),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    currency    VARCHAR(10) NOT NULL DEFAULT 'USD',
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMP WITH TIME ZONE
);

CREATE INDEX portfolios_user_id_idx ON portfolios (user_id);

CREATE TABLE portfolio_members (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role         VARCHAR(20) NOT NULL DEFAULT 'viewer',
    invited_by   UUID REFERENCES users (id),
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (portfolio_id, user_id)
);

-- ─── Assets ──────────────────────────────────────────────────────────────────

CREATE TABLE assets (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id     UUID NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    name             VARCHAR(255) NOT NULL,
    asset_type       VARCHAR(50)  NOT NULL,
    ticker           VARCHAR(50),
    quantity         NUMERIC(28, 10),
    purchase_price   NUMERIC(28, 10),
    current_price    NUMERIC(28, 10),
    currency         VARCHAR(10)  NOT NULL DEFAULT 'USD',
    ownership_pct    NUMERIC(8, 4) NOT NULL DEFAULT 100,
    investability    VARCHAR(20),
    location         TEXT,
    metadata         JSONB,
    last_price_sync  TIMESTAMP WITH TIME ZONE,
    acquisition_date TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMP WITH TIME ZONE
);

CREATE INDEX assets_portfolio_id_idx ON assets (portfolio_id);
CREATE INDEX assets_ticker_idx ON assets (ticker) WHERE ticker IS NOT NULL;

-- ─── Debts ───────────────────────────────────────────────────────────────────

CREATE TABLE debts (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id   UUID NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    debt_type      VARCHAR(50)  NOT NULL,
    principal      NUMERIC(28, 10) NOT NULL,
    balance        NUMERIC(28, 10) NOT NULL,
    interest_rate  NUMERIC(8, 4),
    payment_amount NUMERIC(28, 10),
    frequency      VARCHAR(20),
    has_schedule   BOOLEAN NOT NULL DEFAULT FALSE,
    currency       VARCHAR(10)  NOT NULL DEFAULT 'USD',
    ownership_pct  NUMERIC(8, 4) NOT NULL DEFAULT 100,
    start_date     TIMESTAMP WITH TIME ZONE,
    payoff_date    TIMESTAMP WITH TIME ZONE,
    metadata       JSONB,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMP WITH TIME ZONE
);

CREATE INDEX debts_portfolio_id_idx ON debts (portfolio_id);

-- ─── Autopilot Rules ─────────────────────────────────────────────────────────

CREATE TABLE autopilot_rules (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    rule_type    VARCHAR(50) NOT NULL,
    target_id    UUID,
    amount       NUMERIC(28, 10),
    percentage   NUMERIC(8, 4),
    frequency    VARCHAR(20) NOT NULL,
    start_date   TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date     TIMESTAMP WITH TIME ZONE,
    last_run_at  TIMESTAMP WITH TIME ZONE,
    next_run_at  TIMESTAMP WITH TIME ZONE,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    metadata     JSONB,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX autopilot_rules_portfolio_id_idx ON autopilot_rules (portfolio_id);
CREATE INDEX autopilot_rules_next_run_at_idx ON autopilot_rules (next_run_at) WHERE is_active = TRUE;

-- ─── Snapshots ───────────────────────────────────────────────────────────────

CREATE TABLE snapshots (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    total_assets NUMERIC(28, 10) NOT NULL,
    total_debts  NUMERIC(28, 10) NOT NULL,
    net_worth    NUMERIC(28, 10) NOT NULL,
    currency     VARCHAR(10) NOT NULL DEFAULT 'USD',
    allocation   JSONB,
    snapped_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX snapshots_portfolio_id_snapped_at_idx ON snapshots (portfolio_id, snapped_at DESC);

-- ─── Vault Documents ─────────────────────────────────────────────────────────

CREATE TABLE vault_documents (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    file_name    VARCHAR(500) NOT NULL,
    file_type    VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size    BIGINT,
    tags         JSONB,
    uploaded_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMP WITH TIME ZONE
);

-- ─── Asset Documents ─────────────────────────────────────────────────────────

CREATE TABLE asset_documents (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id     UUID REFERENCES assets (id) ON DELETE SET NULL,
    debt_id      UUID REFERENCES debts (id) ON DELETE SET NULL,
    portfolio_id UUID NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    file_name    VARCHAR(500) NOT NULL,
    file_type    VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size    BIGINT,
    tags         JSONB,
    uploaded_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMP WITH TIME ZONE
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE IF EXISTS asset_documents;
DROP TABLE IF EXISTS vault_documents;
DROP TABLE IF EXISTS snapshots;
DROP TABLE IF EXISTS autopilot_rules;
DROP TABLE IF EXISTS debts;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS portfolio_members;
DROP TABLE IF EXISTS portfolios;
DROP TABLE IF EXISTS users;

-- +goose StatementEnd
