-- +goose Up
-- Running totals of cash_in / cash_out for an asset, kept in sync by the
-- application whenever asset_cash_flows is written to (see
-- store/asset_cash_flow.go). Lets the assets list show "money in / money out"
-- without an extra query per read — asset_cash_flows stays the detailed log.

ALTER TABLE assets
    ADD COLUMN total_cash_in  NUMERIC(28, 10) NOT NULL DEFAULT 0,
    ADD COLUMN total_cash_out NUMERIC(28, 10) NOT NULL DEFAULT 0;

-- Backfill from the existing log. Without this, every asset created before this
-- migration reads as zero forever: the application only ever adds to these
-- totals as new flows arrive, it never recomputes them from asset_cash_flows.
--
-- This sums raw amounts without currency conversion, matching exactly what
-- CreateCashFlow does at runtime. (Cash flows carry their own currency, so a
-- mixed-currency asset's total is the sum of unconverted amounts — a
-- pre-existing modelling quirk this migration deliberately does not change.)
--
-- No-op on a fresh database.
UPDATE assets a
SET total_cash_in  = COALESCE(f.cash_in, 0),
    total_cash_out = COALESCE(f.cash_out, 0)
FROM (
    SELECT asset_id,
           SUM(amount) FILTER (WHERE flow_type = 'cash_in')  AS cash_in,
           SUM(amount) FILTER (WHERE flow_type = 'cash_out') AS cash_out
    FROM asset_cash_flows
    GROUP BY asset_id
) f
WHERE a.id = f.asset_id;

-- +goose Down
ALTER TABLE assets
    DROP COLUMN IF EXISTS total_cash_in,
    DROP COLUMN IF EXISTS total_cash_out;
