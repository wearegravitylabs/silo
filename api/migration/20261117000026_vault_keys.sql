-- +goose Up
-- Vault password (one per portfolio). Files are encrypted in the browser with
-- a random vault key; the server stores only that key wrapped (encrypted)
-- with a key derived from the password, the salt and KDF settings to derive
-- it, and a hash of a separate "verifier" derived from the password, which
-- proves the password before the wrapped key is handed out. The server never
-- sees the password or the vault key.

-- +goose StatementBegin
CREATE TABLE portfolio_vaults (
    portfolio_id  UUID PRIMARY KEY REFERENCES portfolios (id) ON DELETE CASCADE,
    wrapped_key   TEXT    NOT NULL,
    salt          TEXT    NOT NULL,
    kdf           JSONB   NOT NULL,
    verifier_hash TEXT    NOT NULL,
    key_version   INT     NOT NULL DEFAULT 1,
    set_by        UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Wrong unlock attempts per person, to slow down password guessing.
CREATE TABLE vault_unlock_attempts (
    portfolio_id UUID NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    failed       INT  NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (portfolio_id, user_id)
);

-- How each file was encrypted (algorithm, IV, key version), as the browser
-- sent it. Files uploaded before this stay readable with encrypted = false.
ALTER TABLE vault_documents
    ADD COLUMN IF NOT EXISTS encrypted  BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS encryption JSONB;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE vault_documents DROP COLUMN IF EXISTS encryption, DROP COLUMN IF EXISTS encrypted;
DROP TABLE IF EXISTS vault_unlock_attempts;
DROP TABLE IF EXISTS portfolio_vaults;
-- +goose StatementEnd
