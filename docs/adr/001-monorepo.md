# ADR 001 — Monorepo with Open-Core Separation

**Date:** 2026-06-02  
**Status:** Accepted

## Context

Silo has two delivery targets:
1. An AGPL v3 open-source self-hosted version
2. A proprietary managed cloud version with additional features (Plaid, Stripe, push)

We needed to decide how to organise code across repositories.

## Decision

**Single public monorepo** (`wearegravitylabs/silo`) containing:
- `api/` — Go backend
- `web/` — React frontend

**Separate private repo** (`wearegravitylabs/silo-cloud`) for cloud-only feature implementations, which imports the core as a Go module dependency.

Cloud-only capabilities are defined as Go interfaces in `api/ports/ports.go`. The OSS binary leaves these nil; the cloud binary injects real implementations at startup.

## Rationale

| Option | Considered | Why rejected |
|--------|-----------|--------------|
| FE + BE in separate repos | Yes | Fragmented contributor experience; Docker Compose harder |
| Build tags for cloud features | Yes | Cloud source code visible in AGPL repo; violates separation |
| Monorepo with private submodule | Yes | Complex tooling, poor GitHub UX |
| **Monorepo + private cloud repo via interfaces** | **Chosen** | Clean separation, standard Go open-core pattern (Gitea EE, Metabase) |

## Consequences

- Contributors see the full application in one place
- Cloud-only code remains truly private and proprietary
- The `ports/` package is a stable public API — breaking changes require a major version
- The cloud repo must pin a specific core version and test against it
