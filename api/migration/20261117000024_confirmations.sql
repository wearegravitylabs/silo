-- +goose Up
-- confirmation_codes: 6-digit codes emailed to confirm a risky action
-- (deleting the account or a portfolio). Stored as a bcrypt hash.
-- email_changes: pending email changes, confirmed by a link sent to the new
-- address. The link token is stored as a SHA-256 hash.

-- +goose StatementBegin
CREATE TABLE confirmation_codes (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    purpose    VARCHAR(40)  NOT NULL,
    target_id  UUID,
    code_hash  TEXT         NOT NULL,
    attempts   INT          NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at    TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX confirmation_codes_lookup_idx ON confirmation_codes (user_id, purpose, created_at DESC);

CREATE TABLE email_changes (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    new_email  VARCHAR(255) NOT NULL,
    token_hash TEXT         NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at    TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX email_changes_user_idx ON email_changes (user_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS email_changes;
DROP TABLE IF EXISTS confirmation_codes;
-- +goose StatementEnd
