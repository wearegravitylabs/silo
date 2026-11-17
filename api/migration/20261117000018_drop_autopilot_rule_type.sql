-- +goose Up
-- rule_type is left over from the first schema. Rules have been described by
-- target_type + action since 20260607000012, and the Go model never sets it,
-- so every insert failed on its NOT NULL constraint.

ALTER TABLE autopilot_rules DROP COLUMN IF EXISTS rule_type;

-- +goose Down
ALTER TABLE autopilot_rules ADD COLUMN rule_type VARCHAR(50) NOT NULL DEFAULT 'legacy';
