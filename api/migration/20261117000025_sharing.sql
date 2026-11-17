-- +goose Up
-- Sharing:
--   portfolio_members.status    'invited' until accepted, then 'active'
--                    .sections  what a non-owner member can open
--   portfolio_invite_links      one copyable link per portfolio; opening it
--                               lets someone ask to join
--   portfolio_access_requests   those asks, for the owner to approve
--   portfolio_public_links      read-only links for people without an account

-- +goose StatementBegin
UPDATE portfolio_members SET status = 'active'  WHERE status = 'accepted';
UPDATE portfolio_members SET status = 'invited' WHERE status = 'pending';
DELETE FROM portfolio_members WHERE status = 'declined';
ALTER TABLE portfolio_members ALTER COLUMN status SET DEFAULT 'active';
UPDATE portfolio_members SET accepted_at = created_at WHERE status = 'active' AND accepted_at IS NULL;

-- Existing members keep seeing everything they saw before.
ALTER TABLE portfolio_members
    ADD COLUMN IF NOT EXISTS sections TEXT[] NOT NULL
        DEFAULT ARRAY['dashboard','insights','assets','debts','projections']::TEXT[];
UPDATE portfolio_members
SET sections = ARRAY['dashboard','insights','assets','debts','vault','projections']::TEXT[];

CREATE TABLE portfolio_invite_links (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID        NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    token        VARCHAR(64) NOT NULL UNIQUE,
    role         VARCHAR(20) NOT NULL DEFAULT 'viewer',
    created_by   UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    revoked_at   TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX portfolio_invite_links_portfolio_idx ON portfolio_invite_links (portfolio_id) WHERE revoked_at IS NULL;

CREATE TABLE portfolio_access_requests (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID        NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role         VARCHAR(20) NOT NULL DEFAULT 'viewer',
    status       VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | approved | declined
    decided_by   UUID REFERENCES users (id) ON DELETE SET NULL,
    decided_at   TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX portfolio_access_requests_pending_uidx
    ON portfolio_access_requests (portfolio_id, user_id) WHERE status = 'pending';

CREATE TABLE portfolio_public_links (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID        NOT NULL REFERENCES portfolios (id) ON DELETE CASCADE,
    token        VARCHAR(64) NOT NULL UNIQUE,
    sections     TEXT[]      NOT NULL,
    created_by   UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    revoked_at   TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX portfolio_public_links_portfolio_idx ON portfolio_public_links (portfolio_id) WHERE revoked_at IS NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS portfolio_public_links;
DROP TABLE IF EXISTS portfolio_access_requests;
DROP TABLE IF EXISTS portfolio_invite_links;
ALTER TABLE portfolio_members DROP COLUMN IF EXISTS sections;
UPDATE portfolio_members SET status = 'accepted' WHERE status = 'active';
UPDATE portfolio_members SET status = 'pending'  WHERE status = 'invited';
ALTER TABLE portfolio_members ALTER COLUMN status SET DEFAULT 'accepted';
-- +goose StatementEnd
