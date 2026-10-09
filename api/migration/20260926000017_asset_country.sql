-- +goose Up
-- Market a stock_ticker asset is listed in ("NG" or "US"). Needed so the daily
-- price job asks the right exchange and so the asset is priced in that market's
-- currency. Stocks that existed before this column were priced via a US-oriented
-- provider, so they are backfilled as US.

ALTER TABLE assets ADD COLUMN country VARCHAR(2);

UPDATE assets SET country = 'US' WHERE asset_type = 'stock_ticker';

-- +goose Down
ALTER TABLE assets DROP COLUMN IF EXISTS country;
