-- +goose Up

ALTER TABLE asset_notes ADD COLUMN IF NOT EXISTS tags JSONB;

-- +goose Down

ALTER TABLE asset_notes DROP COLUMN IF EXISTS tags;
