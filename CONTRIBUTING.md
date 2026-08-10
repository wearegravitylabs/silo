# Contributing to Silo

Thank you for your interest in contributing. This guide covers everything you need to go from a fresh clone to an accepted pull request.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Security Vulnerabilities](#security-vulnerabilities)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold it. Please report unacceptable behaviour to the maintainers.

---

## Getting Started

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Go | 1.25 |
| Node.js | 22 |
| Docker & Docker Compose | v2 |
| [pre-commit](https://pre-commit.com/) | 3.x |

### Local setup

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/silo.git
cd silo

# 2. Install pre-commit hooks (enforces formatting and commit style)
pre-commit install --hook-type commit-msg

# 3. Copy environment config
cp api/.env.example api/.env
# Edit api/.env — at minimum set JWT_SECRET and ENCRYPTION_KEY to random values

# 4. Start the full stack (API + Postgres + Redis + MinIO)
docker compose up
```

The API is now available at `http://localhost:8080` and the web app at `http://localhost:3000`.

### Running services individually

```bash
make dev          # API only (live reload via Air)
make web-dev      # Web frontend only
make migrate-up   # Apply pending database migrations
```

---

## Project Structure

```
api/           Go backend (Gin, GORM, PostgreSQL)
  api/         HTTP handlers (one package per domain)
  app/         Business logic / service interfaces
  model/       Shared data types and request/response models
  store/       Database repositories (GORM)
  pkg/         Shared utilities (currency, assetclass, jwt, …)
  migration/   SQL migrations (Goose)
  thirdparty/  External adapters (Yahoo Finance, CoinGecko, …)

web/           React + TypeScript frontend (Vite)
docs/          User-facing documentation
docker/        Dockerfiles for production builds
```

The API follows a strict layer order: **handler → service (interface) → store**. Handlers never import `store` directly; services never import `api`. Keep this boundary clean.

---

## Development Workflow

1. **Check for an existing issue** before starting work. If none exists, open one so maintainers can confirm the direction.
2. **Branch from `main`** using a descriptive name: `feat/asset-notes`, `fix/pagination-offset`, `docs/self-hosting`.
3. **Write tests** for any new logic in `pkg/`, `model/`, or `app/`. Pure functions and service helpers are the highest-priority targets.
4. **Run the full check** before pushing:

   ```bash
   make lint   # golangci-lint (backend) + eslint + tsc (frontend)
   make test   # go test ./... -race
   ```

5. **Open a pull request** against `main`.

### Adding a database migration

```bash
make migrate-create NAME=add_asset_notes
# Edit the generated file at api/migration/YYYYMMDDHHMMSS_add_asset_notes.sql
make migrate-up
```

Migrations must be **additive** (new tables, new nullable columns, new indexes). Destructive changes (column removal, type changes) require a maintenance window comment in the migration file.

---

## Coding Standards

### Go

- Format with `gofmt` / `goimports` — the pre-commit hook enforces this.
- Run `golangci-lint run` and fix all issues before opening a PR.
- Prefer table-driven tests using `t.Run`.
- Use `context.Context` as the first parameter in every function that performs I/O.
- Return errors; never `log.Fatal` outside of `main.go`.
- Do not add comments that just restate the function signature. Add a comment only when the *why* is non-obvious.

### Layering rules

| Layer | May import | Must not import |
|-------|-----------|-----------------|
| `api/` (handlers) | `app/`, `model/`, `pkg/` | `store/` |
| `app/` (services) | `model/`, `pkg/`, `store/` | `api/` |
| `store/` | `model/` | `app/`, `api/` |
| `model/` | `pkg/` | everything above |

### Frontend (React / TypeScript)

- Run `npm run typecheck` and `npm run lint` before committing.
- No `any` unless absolutely unavoidable — add a comment explaining why.
- Component files use PascalCase; utility files use camelCase.

---

## Commit Messages

Commits are linted by [commitlint](https://commitlint.js.org/) using the **Conventional Commits** format:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

**Examples:**

```
feat(asset): add cash flow tracking to manual assets
fix(debt): correct amortization for biannual frequency
docs(self-hosting): add Redis TLS configuration example
test(currency): add lookup edge-case coverage
```

Breaking changes must include `BREAKING CHANGE:` in the footer or use `!` after the type:

```
feat(auth)!: replace OTP with passkey authentication

BREAKING CHANGE: The POST /auth/verify-code endpoint now expects a
passkey assertion instead of a 6-digit code.
```

The pre-commit hook will reject commits that don't match this format.

---

## Pull Request Process

1. Fill in the pull request template completely.
2. Ensure all CI checks pass (lint, typecheck, tests).
3. Add or update documentation in `docs/` if your change affects self-hosting or configuration.
4. Link the related issue using `Closes #<issue>` or `Fixes #<issue>` in the PR description.
5. Keep PRs focused — one logical change per PR. If you notice an unrelated issue, open a separate PR or issue.
6. A maintainer will review your PR within a few business days. Address review comments in follow-up commits (don't force-push after review has started, as it makes re-review harder).

PRs are squash-merged. Your individual commit history within the PR does not need to be perfectly clean, but the merge commit message will follow Conventional Commits.

---

## Reporting Issues

Use the [GitHub Issues](https://github.com/wearegravitylabs/silo/issues) tab and choose the appropriate template:

- **Bug report** — something is broken or behaving unexpectedly.
- **Feature request** — a new capability you'd like to see.

Before opening an issue, search existing issues (including closed ones) to avoid duplicates.

---

## Security Vulnerabilities

**Do not open a public GitHub issue for security vulnerabilities.**

Please read [SECURITY.md](SECURITY.md) for responsible-disclosure instructions.

---

## License

By contributing to Silo you agree that your contributions will be licensed under the [GNU Affero General Public License v3.0](LICENSE). You retain copyright over your own contributions.
