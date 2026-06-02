# Silo

> Your personal silo of wealth — isolated, safe, controlled by you.

Silo is an open-source, privacy-first portfolio tracker that empowers individuals to track, analyze, and understand their entire financial life in one unified platform.

## Features

- **Comprehensive Asset Tracking** — stocks, crypto, real estate, VC, business, bank accounts, and more
- **Debt Management** — mortgages, student loans, car loans, credit cards with full amortization
- **Auto-Pilot** — automated recurring contributions and loan amortization rules
- **AI-Powered** — natural language command bar (⌘K), daily portfolio summaries, NLP queries
- **Privacy-First** — zero-knowledge encrypted Vault, full data ownership
- **Multi-User** — collaborative portfolios with role-based permissions (Owner/Editor/Viewer)
- **Fast Forward** — project future net worth with scenario modeling
- **Multi-Currency** — track assets across currencies with live FX conversion

## Architecture

This is a monorepo containing:

| Directory | Contents |
|-----------|----------|
| `api/` | Go backend (Gin, GORM, PostgreSQL) |
| `web/` | React frontend (Vite, TypeScript) |
| `docs/` | Documentation |
| `docker/` | Dockerfiles |

## Dual Model

| | Open-Source (Self-Hosted) | Cloud (Managed) |
|--|--------------------------|-----------------|
| Core Features | All | All |
| AI Insights | Bring your own API key | Built-in |
| Bank Connections | Manual entry | Plaid integration |
| Hosting | Your infrastructure | Managed |
| Price | Free | $20/mo or $120/yr |

## Quick Start (Self-Hosted)

```bash
git clone https://github.com/wearegravitylabs/silo
cd silo
cp api/.env.example api/.env
# Edit api/.env with your configuration
docker compose up
```

Then open http://localhost:3000.

## Development

**Prerequisites:** Go 1.25+, Node.js 22+, Docker

```bash
# Backend
make dev

# Frontend
make web-dev

# Run tests
make test

# Run linter
make lint

# Run migrations
make migrate-up
```

See [docs/self-hosting.md](docs/self-hosting.md) for full self-hosting guide.

## Open-Core Architecture

The core codebase is fully open-source under AGPL v3. Cloud-only features (Plaid bank connections, Stripe billing, push notifications) are implemented in a separate private repository that extends the core via well-defined interfaces in [`api/ports/`](api/ports/). See [docs/open-core.md](docs/open-core.md) for details.

## Contributing

Pull requests are welcome. Please read the [contribution guidelines](CONTRIBUTING.md) and ensure your commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## License

[GNU Affero General Public License v3.0](LICENSE) — you are free to use, modify, and distribute this software, but if you run it as a network service (SaaS), you must release your modifications under the same license.
