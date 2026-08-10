-- +goose Up

CREATE TABLE asset_notes (
    id           UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    asset_id     UUID        REFERENCES assets (id) ON DELETE CASCADE,
    debt_id      UUID        REFERENCES debts (id)  ON DELETE CASCADE,
    portfolio_id UUID        NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    title        TEXT        NOT NULL DEFAULT '',
    content      TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);

CREATE INDEX asset_notes_asset_id_idx ON asset_notes (asset_id) WHERE deleted_at IS NULL;
CREATE INDEX asset_notes_debt_id_idx  ON asset_notes (debt_id)  WHERE deleted_at IS NULL;

-- +goose Down

DROP TABLE IF EXISTS asset_notes;
