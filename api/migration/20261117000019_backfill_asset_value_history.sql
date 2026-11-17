-- +goose Up
-- Until now GORM wrote value history to "asset_value_histories", a table that
-- does not exist, so asset_value_history is empty. Give every live asset a
-- starting history: one point per lot at its purchase date, plus its value
-- today, so value charts and dashboard changes are not blank.

-- +goose StatementBegin
INSERT INTO asset_value_history (asset_id, value, currency, source, recorded_at)
SELECT l.asset_id, l.acquisition_price * l.quantity, a.currency, 'manual', l.acquisition_date
FROM asset_lots l
JOIN assets a ON a.id = l.asset_id
WHERE a.deleted_at IS NULL
  AND l.acquisition_price > 0
  AND NOT EXISTS (SELECT 1 FROM asset_value_history h WHERE h.asset_id = a.id);

INSERT INTO asset_value_history (asset_id, value, currency, source, recorded_at)
SELECT a.id, a.current_price * a.quantity, a.currency, 'manual', NOW()
FROM assets a
WHERE a.deleted_at IS NULL
  AND a.current_price > 0
  AND a.quantity > 0
  AND NOT EXISTS (
      SELECT 1 FROM asset_value_history h
      WHERE h.asset_id = a.id AND h.recorded_at::date = NOW()::date
  );
-- +goose StatementEnd

-- +goose Down
-- Backfilled rows can't be told apart from real ones; nothing to undo.
SELECT 1;
