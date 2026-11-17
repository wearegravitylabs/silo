-- +goose Up
-- History points written at lot purchase dates (by 20261117000019 and by
-- asset creation) valued each lot on its own, so an asset bought in two lots
-- showed only the second lot's value on the second date. Revalue those points
-- as everything held on that date × that lot's price, the way stock history
-- is written. Only points that sit exactly on a lot's purchase date and still
-- equal that lot's own value are touched, so user-entered values are left alone.

-- +goose StatementBegin
WITH held AS (
    SELECT l.asset_id,
           l.acquisition_date,
           l.acquisition_price,
           l.quantity * l.acquisition_price AS lot_value,
           SUM(l.quantity) OVER (PARTITION BY l.asset_id ORDER BY l.acquisition_date, l.created_at
                                 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS held_qty
    FROM asset_lots l
    WHERE l.acquisition_price > 0
)
UPDATE asset_value_history h
SET value = held.held_qty * held.acquisition_price
FROM held
WHERE h.asset_id = held.asset_id
  -- Code wrote midnight UTC; the 20261117000019 backfill wrote midnight in
  -- the session time zone. Match the lot's day either way.
  AND ((h.recorded_at AT TIME ZONE 'UTC')::date = held.acquisition_date
       OR h.recorded_at::date = held.acquisition_date)
  AND h.source = 'manual'
  AND h.value = held.lot_value
  AND held.held_qty * held.acquisition_price <> held.lot_value;
-- +goose StatementEnd

-- +goose Down
SELECT 1;
