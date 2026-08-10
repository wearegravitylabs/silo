-- +goose Up
-- Add folder_type to distinguish asset folders from debt folders.
-- Existing rows are backfilled to 'asset'.

ALTER TABLE folders
    ADD COLUMN folder_type VARCHAR(10) NOT NULL DEFAULT 'asset';

-- Backfill complete; remove the default so future inserts must supply a type explicitly.
ALTER TABLE folders
    ALTER COLUMN folder_type DROP DEFAULT;

CREATE INDEX folders_portfolio_id_type_position_idx ON folders (portfolio_id, folder_type, position);

-- +goose Down
DROP INDEX IF EXISTS folders_portfolio_id_type_position_idx;
ALTER TABLE folders DROP COLUMN IF EXISTS folder_type;
