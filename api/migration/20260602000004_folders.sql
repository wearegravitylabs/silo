-- +goose Up
-- +goose StatementBegin

-- ─── Folders ─────────────────────────────────────────────────────────────────

CREATE TABLE folders (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    icon         VARCHAR(50),  -- emoji or short identifier, e.g. "📈"
    image_url    TEXT,         -- optional user-uploaded cover image
    position     INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ordered by position for list queries; portfolio-scoped.
CREATE INDEX folders_portfolio_id_position_idx ON folders (portfolio_id, position);

-- ─── Assets — folder FK ───────────────────────────────────────────────────────

ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders (id) ON DELETE SET NULL;

-- Sparse index — most queries filter by portfolio_id first, so this covers
-- "show me all assets in folder X".
CREATE INDEX assets_folder_id_idx ON assets (folder_id)
    WHERE folder_id IS NOT NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS assets_folder_id_idx;
ALTER TABLE assets DROP COLUMN IF EXISTS folder_id;

DROP INDEX IF EXISTS folders_portfolio_id_position_idx;
DROP TABLE IF EXISTS folders;

-- +goose StatementEnd
