-- +goose Up

ALTER TABLE portfolios RENAME COLUMN currency TO base_currency;

-- +goose Down

ALTER TABLE portfolios RENAME COLUMN base_currency TO currency;
