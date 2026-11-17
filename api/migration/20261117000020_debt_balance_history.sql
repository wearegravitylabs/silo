-- +goose Up
-- One row per known balance of a debt, so the debt chart, the 1-month change
-- and the dashboard net-worth chart have something to draw. Written when a debt
-- is created and whenever its balance changes; before this, a new balance just
-- overwrote the old one.
--
-- Also adds debts.icon, which the app lets the user pick.

-- +goose StatementBegin
CREATE TABLE debt_balance_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id     UUID            NOT NULL REFERENCES debts (id) ON DELETE CASCADE,
    balance     NUMERIC(28, 10) NOT NULL,
    currency    VARCHAR(10)     NOT NULL DEFAULT 'USD',
    source      VARCHAR(20)     NOT NULL DEFAULT 'manual', -- manual | create
    note        TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX debt_balance_history_debt_idx
    ON debt_balance_history (debt_id, recorded_at DESC);

ALTER TABLE debts ADD COLUMN IF NOT EXISTS icon TEXT;

-- Starting history for existing debts: the original principal on the start
-- date (when known and earlier than today), and the balance today.
INSERT INTO debt_balance_history (debt_id, balance, currency, source, recorded_at)
SELECT d.id, d.principal, d.currency, 'create', d.start_date
FROM debts d
WHERE d.deleted_at IS NULL AND d.start_date IS NOT NULL AND d.start_date < NOW()::date;

INSERT INTO debt_balance_history (debt_id, balance, currency, source, recorded_at)
SELECT d.id, d.balance, d.currency, 'manual', NOW()
FROM debts d
WHERE d.deleted_at IS NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE debts DROP COLUMN IF EXISTS icon;
DROP TABLE IF EXISTS debt_balance_history;
-- +goose StatementEnd
