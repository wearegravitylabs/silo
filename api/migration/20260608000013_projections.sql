-- +goose Up

CREATE TABLE projection_scenarios (
    id           UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    portfolio_id UUID        NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    description  TEXT        NOT NULL DEFAULT '',
    is_default   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX projection_scenarios_portfolio_id_idx ON projection_scenarios (portfolio_id);

CREATE TABLE projection_rules (
    id          UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    scenario_id UUID        NOT NULL REFERENCES projection_scenarios (id) ON DELETE CASCADE,
    rule_type   VARCHAR(50) NOT NULL,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    config      JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX projection_rules_scenario_id_idx ON projection_rules (scenario_id);

-- +goose Down

DROP TABLE IF EXISTS projection_rules;
DROP TABLE IF EXISTS projection_scenarios;
