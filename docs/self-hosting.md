# Self-Hosting Silo

This guide covers running Silo on your own infrastructure using Docker Compose.

## Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 20 GB | 50 GB |
| OS | Linux (Ubuntu 22.04+), macOS, Windows WSL2 |

## Quick Start

```bash
git clone https://github.com/wearegravitylabs/silo
cd silo

# Copy and edit the environment file
cp api/.env.example api/.env

# Generate cryptographic keys
make genkey
# → Copy the output into api/.env

# Start all services
docker compose up -d

# Run database migrations
make migrate-up

# Open the app
open http://localhost:3000
```

## Services

| Service | Port | Purpose |
|---------|------|---------|
| Silo API | 8080 | Go backend |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Caching / job queue |
| MinIO | 9000 | Object storage (documents, vault) |
| MinIO Console | 9001 | MinIO admin UI |
| Silo Web | 3000 | React frontend (dev only) |

## Configuration

All configuration is via environment variables in `api/.env`. Key settings:

```bash
# Required — generate with: make genkey
JWT_SIGNING_SECRET=<32-byte-hex>
ENCRYPTION_KEY=<32-byte-hex>

# Required — your PostgreSQL connection
PG_ADDRESS=localhost
PG_PASSWORD=<your-password>

# Optional — for AI insights (bring your own key)
ANTHROPIC_API_KEY=<your-anthropic-key>
CLAUDE_MODEL=claude-sonnet-4-6

# Optional — for crypto prices
COINGECKO_API_KEY=<your-coingecko-key>

# Optional — for FX rates
EXCHANGERATE_API_KEY=<your-key>
```

## Updates

```bash
git pull
docker compose build
docker compose up -d
make migrate-up
```

## Backups

```bash
# Database
docker compose exec postgres pg_dump -U silo silo > backup-$(date +%Y%m%d).sql

# Restore
cat backup-20260602.sql | docker compose exec -T postgres psql -U silo silo
```

## Recommended Hosts

| Provider | Instance | Monthly Cost |
|----------|----------|-------------|
| Hetzner | CX21 (2 vCPU, 4 GB) | ~$5 |
| DigitalOcean | Basic Droplet (2 vCPU, 4 GB) | ~$12 |
| Fly.io | shared-cpu-2x | ~$10 |

## Self-Hosted vs Cloud

The self-hosted version does not include:
- Plaid bank connections (use manual balance entry instead)
- Push notifications
- Managed hosting and automated backups

The managed cloud version at [silo.app](https://silo.app) includes these features if you prefer not to run your own infrastructure. See [cloud-vs-self-hosted](open-core.md) for the full comparison.
