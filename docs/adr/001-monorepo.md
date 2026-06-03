# ADR 001 — Monorepo Structure

**Date:** 2026-06-02
**Status:** Accepted

## Context

Silo has two delivery targets:
1. An AGPL v3 open-source self-hosted version
2. A managed cloud version with additional features (Plaid, Stripe, push notifications)

We needed to decide how to organise the codebase.

## Decision

**Single public monorepo** (`wearegravitylabs/silo`) containing:
- `api/` — Go backend
- `web/` — React frontend

## Rationale

| Option | Considered | Why rejected |
|--------|-----------|--------------|
| FE + BE in separate repos | Yes | Fragmented contributor experience; Docker Compose harder |
| **Monorepo** | **Chosen** | Single place for contributors; atomic commits across stack; one-command Docker Compose deployment |

## Consequences

- Contributors see the full application in one place
- Docker Compose self-hosting is a single `docker compose up` command
- CI runs both backend and frontend checks on every PR
