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

## File Storage

Silo uses MinIO for self-hosted file storage (document uploads, asset images, vault files).
MinIO is already included in `docker compose` — **no extra installation needed.**

### Default setup (MinIO — works out of the box)

```bash
STORAGE_PROVIDER=minio
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=silo
STORAGE_REGION=us-east-1
STORAGE_PUBLIC_URL=http://localhost:9000/silo
```

**The `silo` bucket is created automatically on first startup.** You do not need to
create it manually or visit the MinIO console.

### MinIO Console (optional)

The MinIO web console is available at `http://localhost:9001`.
Login: `minioadmin` / `minioadmin`

You can use it to browse uploaded files, manage buckets, and create additional access keys.

### Production: use Cloudflare R2 or AWS S3

For production deployments, we recommend Cloudflare R2 (zero egress fees) or AWS S3:

**Cloudflare R2:**
```bash
STORAGE_PROVIDER=r2
STORAGE_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=<r2_access_key>
STORAGE_SECRET_KEY=<r2_secret_key>
STORAGE_BUCKET=silo
STORAGE_REGION=auto
STORAGE_PUBLIC_URL=https://pub-<token>.r2.dev
```
Create the bucket in the Cloudflare dashboard before starting Silo, or let Silo create it
automatically (requires the R2 API token to have bucket create permissions).

**AWS S3:**
```bash
STORAGE_PROVIDER=s3
STORAGE_ACCESS_KEY=<aws_access_key>
STORAGE_SECRET_KEY=<aws_secret_key>
STORAGE_BUCKET=silo
STORAGE_REGION=us-east-1
STORAGE_PUBLIC_URL=https://silo.s3.amazonaws.com
```
Create the S3 bucket first via the AWS console or `aws s3 mb s3://silo`.

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
