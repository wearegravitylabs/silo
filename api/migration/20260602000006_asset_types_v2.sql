-- +goose Up
-- +goose StatementBegin

-- ─── Assets — subtype for physical assets ────────────────────────────────────
ALTER TABLE assets ADD COLUMN IF NOT EXISTS subtype VARCHAR(50);

CREATE INDEX IF NOT EXISTS assets_subtype_idx
    ON assets (subtype)
    WHERE subtype IS NOT NULL;

-- ─── Cash flows ───────────────────────────────────────────────────────────────
-- Income and expenses tied to an asset (rent, dividends, maintenance, etc.)
-- The initial cost basis lives in asset_lots, not here.

CREATE TABLE asset_cash_flows (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id  UUID         NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
    flow_type VARCHAR(10)  NOT NULL CHECK (flow_type IN ('cash_in', 'cash_out')),
    category  VARCHAR(50)  NOT NULL,
    amount    NUMERIC(28, 10) NOT NULL CHECK (amount > 0),
    currency  VARCHAR(10)  NOT NULL DEFAULT 'USD',
    flow_date DATE         NOT NULL,
    notes     TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX asset_cash_flows_asset_id_idx ON asset_cash_flows (asset_id);
CREATE INDEX asset_cash_flows_date_idx     ON asset_cash_flows (asset_id, flow_date DESC);

-- ─── Asset value history ──────────────────────────────────────────────────────
-- One row per price snapshot per asset.
-- Written automatically when current_price is manually updated,
-- and by the daily price-sync cron job for ticker assets.

CREATE TABLE asset_value_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id    UUID         NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
    value       NUMERIC(28, 10) NOT NULL,
    currency    VARCHAR(10)  NOT NULL DEFAULT 'USD',
    source      VARCHAR(20)  NOT NULL DEFAULT 'manual',  -- manual | ticker | cron
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX asset_value_history_asset_idx
    ON asset_value_history (asset_id, recorded_at DESC);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS asset_value_history_asset_idx;
DROP TABLE IF EXISTS asset_value_history;

DROP INDEX IF EXISTS asset_cash_flows_date_idx;
DROP INDEX IF EXISTS asset_cash_flows_asset_id_idx;
DROP TABLE IF EXISTS asset_cash_flows;

DROP INDEX IF EXISTS assets_subtype_idx;
ALTER TABLE assets DROP COLUMN IF EXISTS subtype;

-- +goose StatementEnd
