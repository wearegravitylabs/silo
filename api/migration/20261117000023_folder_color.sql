-- +goose Up
-- The folder's colour in the app (any CSS colour), e.g. "#F59E0B".
ALTER TABLE folders ADD COLUMN IF NOT EXISTS color VARCHAR(64);

-- +goose Down
ALTER TABLE folders DROP COLUMN IF EXISTS color;
