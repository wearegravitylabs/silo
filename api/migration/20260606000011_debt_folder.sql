-- +goose Up

ALTER TABLE debts ADD COLUMN folder_id UUID REFERENCES folders (id) ON DELETE SET NULL;

CREATE INDEX debts_folder_id_idx ON debts (folder_id) WHERE folder_id IS NOT NULL;

-- +goose Down

ALTER TABLE debts DROP COLUMN folder_id;
