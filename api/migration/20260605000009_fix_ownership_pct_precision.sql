-- +goose Up
-- NUMERIC(6,4) overflows when ownership_pct = 100 (needs 3 digits before decimal).
-- NUMERIC(8,4) allows up to 9999.9999 — more than enough for percentages.

ALTER TABLE assets
    ALTER COLUMN ownership_pct TYPE NUMERIC(8, 4);

ALTER TABLE debts
    ALTER COLUMN ownership_pct TYPE NUMERIC(8, 4);

-- +goose Down

ALTER TABLE assets
    ALTER COLUMN ownership_pct TYPE NUMERIC(6, 4);

ALTER TABLE debts
    ALTER COLUMN ownership_pct TYPE NUMERIC(6, 4);
