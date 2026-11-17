# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Multi-provider file storage (AWS S3, Cloudflare R2, MinIO) with auto-bucket creation
- Asset document upload with private bucket and presigned URL generation
- All core asset types — stocks, crypto, real estate, VC, business, bank accounts
- Stock asset creation with ticker search and lot tracking via Yahoo Finance
- Cash flow and value history tracking per asset
- CoinGecko integration for crypto price feeds
- `GET /assets/overview` — aggregated portfolio metrics endpoint
- FX conversion: `owned_value_converted` expressed in portfolio base currency
- `total_value` and `owned_value` computed fields on all assets
- Filter support on `GET /assets` (by type, folder, currency, and more)
- `GET /currencies` public endpoint
- User onboarding endpoints with `portfolio_count` tracking
- `RequireEmailVerified` and `RequireOnboarded` middleware for three-tier routing
- Daily `snapshot-capture` job; `GET /snapshots` and `/snapshots/latest` now return data
- Daily `purge-deleted-accounts` job: deleted accounts and portfolios are removed for good after 30 days, files included
- `STORAGE_PUBLIC_ENDPOINT` for signing document links with a browser-reachable address
- `go run ./cmd/fix-content-types` to repair the content type of files uploaded before this release
- `OnAccountDeleted` hooks on `app.Dependency` for cleanup outside the OSS tables
- `app/fx`: one currency converter used by every total (assets, debts, dashboard, snapshots)
- Assets: `invested`, `gain`, `gain_pct`, `change_amount_1m`, `change_pct_1m` (base currency)
- `POST /assets/:id/sell`: partial sells, oldest lots first, proceeds recorded as a `sale_proceeds` cash flow
- Asset updates take `owned_value` (owned share in base currency) and `price_date`
- Asset value history returns `owned_value_converted` and the change from the previous point
- Debt balance history (`debt_balance_history` table, `GET /debts/:id/balance-history`); every balance change is recorded
- `GET /debts/overview`: total, 1-month change, scheduled / unscheduled totals, monthly payments, interest paid this year, debt-free date
- Debts: `icon`, `metadata`, `owned_balance_converted`, `monthly_payment`, 1-month change; updates take `owned_balance`, `balance_date`, `balance_note`
- Dashboard: periods `1D`, `1M`, `3M`, `YTD`, `1Y`, `ALL`; `?movers=today|week|month`; `net_worth_by_currency`; allocation `by_type`, `by_currency`, `by_folder`; `debt_summary`
- Projections: `value_change` rule (category growth for investable assets, stocks, non-investable assets, debts); a projected `cash` line and `net_worth_with_cash`; scenario `color`; `warnings`
- Every new portfolio gets the default "Scenario A"; existing portfolios without a scenario get it too
- Users: `date_of_birth` (for "until age" income) and `settings` (merged on PATCH, e.g. `projections_intro_seen`)

### Changed

- Caller scoping (`callerID`) propagated through all service and store layers to prevent cross-portfolio data leaks
- Portfolio role authorization moved to middleware layer
- Asset folder assignment is now required on creation (`folder_id`)
- PATCH bodies tell `null` apart from a missing key: `folder_id`, `avatar_url`, `icon` and `image_url` can be cleared with `null`. An asset can now be outside any folder
- Projection rule add/update/toggle return the rule (delete returns null) instead of the recomputed projection
- Deleting an account also deletes portfolios the user alone owns, hands shared ones to another owner, revokes sessions and frees the email for a new sign-up
- `/insights/*` answer `501 NOT_AVAILABLE` on the open-source server
- `FOLDER_TYPE_MISMATCH` is a 400, not a 500
- Removed the unused `thirdparty/storage/minio` adapter; MinIO runs through the S3 client
- Dashboard totals, allocation, movers and chart are in the base currency. The chart is rebuilt day by day from asset and debt history (weekly beyond two years), with today's live value as the last point
- An unknown dashboard period is `400 INVALID_PERIOD` instead of silently returning 1M
- Asset and debt create/update responses carry lots and converted fields (they were zero)
- The amortization schedule starts today from the current balance, allows 0% loans, and handles `biannual`
- The projection engine was rewritten (one engine for compute and chart, tested against hand-worked numbers). Rates compound per their frequency and amounts are spread by it; growth rules apply only to what they target, most specific first; debt and fee rules apply only to their debt or asset; income and expenses go through cash and debt payments come from it; debt-free goals and target values move gradually; starting values are in the base currency; inflation raises expenses only
- `/chart` returns monthly points for any horizon, with `change_amount` / `change_pct` from today
- Projection rules are checked on save (`400 INVALID_RULE_CONFIG`)
- Creating a scenario no longer imports fixed-amount autopilot buys as income

### Fixed

- Creating an autopilot rule always failed with 500 (leftover `rule_type` column)
- Asset value history was never saved (wrong table name), leaving asset charts, dashboard chart, net-worth change and top movers empty. Existing assets are backfilled
- Projection compute and chart returned 404 `PORTFOLIO_NOT_FOUND` for everyone
- New debts defaulted to USD instead of the portfolio's base currency
- `GET /debts?folder_id=` returned 400
- Uploaded files were stored as `application/octet-stream`, so images downloaded instead of opening
- Scheduled jobs no longer run for deleted portfolios
- A manual asset created with several lots recorded each lot's value on its own in the history instead of everything held that day; existing points are corrected

### Security

- Ids in the URL are checked against the portfolio in the URL. Before, a member of one portfolio could read or change another portfolio's assets, debts, notes, documents, autopilot rules, projections, folders and vault documents by id (`404 NOT_FOUND` now)
- A folder in a request body, and an autopilot rule's `target_id`, must belong to the same portfolio
- Snapshot and insight routes now require portfolio membership
- Lot insertion during asset creation is now concurrent

[Unreleased]: https://github.com/wearegravitylabs/silo/compare/HEAD
