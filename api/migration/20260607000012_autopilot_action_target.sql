-- +goose Up

ALTER TABLE autopilot_rules
    ADD COLUMN target_type VARCHAR(10)     NOT NULL DEFAULT 'asset',
    ADD COLUMN action      VARCHAR(10)     NOT NULL DEFAULT 'add',
    ADD COLUMN units       NUMERIC(28, 10);     -- fixed quantity for ticker DCA (e.g. 1 TSLA)

-- +goose Down

ALTER TABLE autopilot_rules
    DROP COLUMN target_type,
    DROP COLUMN action,
    DROP COLUMN units;
