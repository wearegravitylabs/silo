-- +goose Up
-- +goose StatementBegin

-- ─── Assets — class + logo columns ───────────────────────────────────────────
-- asset_class is a denormalised copy of the Go assetclass registry code
-- (stock, crypto, real_estate, domain, physical, vc, business, manual).
-- Stored for query performance — single source of truth remains the Go registry.

ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS asset_class VARCHAR(50),
    ADD COLUMN IF NOT EXISTS logo_url    TEXT;

-- Index for filtering/grouping assets by class within a portfolio.
CREATE INDEX IF NOT EXISTS assets_portfolio_asset_class_idx
    ON assets (portfolio_id, asset_class)
    WHERE deleted_at IS NULL;

-- ─── Asset lots ───────────────────────────────────────────────────────────────
-- One asset row represents a position (e.g. "Tesla").
-- Each individual purchase is recorded as an asset_lot.

CREATE TABLE asset_lots (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id          UUID NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
    quantity          NUMERIC(28, 10) NOT NULL CHECK (quantity > 0),
    acquisition_price NUMERIC(28, 10),              -- price per unit at purchase; NULL if unavailable
    acquisition_date  DATE NOT NULL,
    price_date_used   DATE,                         -- actual trading day used when date adjusted
    notes             TEXT,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX asset_lots_asset_id_idx ON asset_lots (asset_id);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS asset_lots_asset_id_idx;
DROP TABLE IF EXISTS asset_lots;

DROP INDEX IF EXISTS assets_portfolio_asset_class_idx;
ALTER TABLE assets
    DROP COLUMN IF EXISTS logo_url,
    DROP COLUMN IF EXISTS asset_class;

-- +goose StatementEnd
