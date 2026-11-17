-- +goose Up
-- Projections support:
--   users.date_of_birth   — for income that runs "until age N"
--   users.settings        — small per-user app settings (e.g. projections intro seen)
--   projection_scenarios.color — the scenario's line colour in the app
-- and a default "Scenario A" for every portfolio that has no scenario yet,
-- with the five rules the app starts from.

-- +goose StatementBegin
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';
ALTER TABLE projection_scenarios ADD COLUMN IF NOT EXISTS color VARCHAR(64) NOT NULL DEFAULT '';

-- The app kept the colour in description as "color:<value>" until now.
UPDATE projection_scenarios
SET color = substring(description FROM 7), description = ''
WHERE description LIKE 'color:%';

WITH created AS (
    INSERT INTO projection_scenarios (portfolio_id, name, description, color, is_default, created_at, updated_at)
    SELECT p.id, 'Scenario A', '', 'var(--color-primary-dark)', TRUE, NOW(), NOW()
    FROM portfolios p
    WHERE p.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM projection_scenarios s WHERE s.portfolio_id = p.id)
    RETURNING id
)
INSERT INTO projection_rules (scenario_id, rule_type, is_active, config, created_at, updated_at)
SELECT c.id, r.rule_type, TRUE, r.config::jsonb, NOW(), NOW()
FROM created c
CROSS JOIN (VALUES
    ('value_change',   '{"target": "investable_assets", "percentage": 7}'),
    ('inflation_rate', '{"percentage": 8}'),
    ('value_change',   '{"target": "stocks", "percentage": 5}'),
    ('value_change',   '{"target": "debts", "percentage": -2}'),
    ('value_change',   '{"target": "non_investable_assets", "percentage": 7}')
) AS r (rule_type, config);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE projection_scenarios DROP COLUMN IF EXISTS color;
ALTER TABLE users DROP COLUMN IF EXISTS settings;
ALTER TABLE users DROP COLUMN IF EXISTS date_of_birth;
-- +goose StatementEnd
