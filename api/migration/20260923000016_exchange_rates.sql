-- +goose Up
-- Cached FX rates, refreshed daily by the fx-rate-refresh scheduled job
-- (app/exchangerate) from exchangerate-api.com. One row per (base_currency,
-- currency) pair, upserted in place — this table only ever holds the latest
-- rate, not a history. base_currency is always 'USD' today (the free-tier
-- endpoint we call is USD-anchored); every other currency's rate is derived
-- from that anchor at read time (see store/exchange_rate.go GetRate).

CREATE TABLE exchange_rates (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency VARCHAR(10)     NOT NULL,
    currency      VARCHAR(10)     NOT NULL,
    rate          NUMERIC(28, 10) NOT NULL,
    fetched_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (base_currency, currency)
);

CREATE INDEX exchange_rates_base_currency_idx ON exchange_rates (base_currency);

-- +goose Down
DROP TABLE IF EXISTS exchange_rates;
