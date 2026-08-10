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

### Changed

- Caller scoping (`callerID`) propagated through all service and store layers to prevent cross-portfolio data leaks
- Portfolio role authorization moved to middleware layer
- Asset folder assignment is now required on creation (`folder_id`)
- Lot insertion during asset creation is now concurrent

[Unreleased]: https://github.com/wearegravitylabs/silo/compare/HEAD
