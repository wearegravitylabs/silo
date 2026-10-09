# Self-Hosting Silo

This guide covers running Silo on your own infrastructure using Docker Compose.

> Deploying to a managed platform (Render, Northflank, Fly.io), or hardening a server
> for real users? Read [deployment.md](deployment.md) — it covers production
> environment variables, object storage, migrations, backups and a security checklist.

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

## Setup checklist

Copy `api/.env.example` to `api/.env`, then work through this list. "Required" items
stop Silo working properly if they are missing.

| Service | Needed for | Required? | Where to get it |
|---------|-----------|-----------|-----------------|
| PostgreSQL | All data | Required | Included in `docker compose` |
| Signing keys (`JWT_SIGNING_SECRET`, `ENCRYPTION_KEY`) | Login and the encrypted Vault | Required | `make genkey` |
| Object storage (MinIO, R2 or S3) | Document uploads, the Vault, asset images | Required for uploads | MinIO is included in `docker compose`; see [File Storage](#file-storage) |
| Email ([Resend](https://resend.com/api-keys)) | Sign-in codes and notifications | Required in production (dev prints to the console) | resend.com |
| [NGN Market](https://ngnmarket.com/developer) | Stock lists, prices and logos for Nigeria (NGX) and the US | Required for stocks | ngnmarket.com/developer. The Free plan covers browsing and current prices; price history needs Hobby or above |
| [exchangerate-api.com](https://www.exchangerate-api.com) | Currency conversion (rates refreshed daily) | Required for multi-currency | exchangerate-api.com (free) |
| [CoinGecko](https://www.coingecko.com/en/api) | Crypto prices | Optional | coingecko.com |
| [Anthropic](https://console.anthropic.com) | AI insights | Optional | console.anthropic.com |

### NGN Market plans: when the Free plan is not enough

The Free plan is fine to start, but it has limits you should know about before you
add a lot of stocks:

| | Free | Hobby ($15 / ₦15,000 a month) | Starter |
|---|---|---|---|
| Calls per month | 3,000 | 10,000 | 100,000 |
| Calls per minute | 30 | 60 | 120 |
| Browse and search stocks, current prices, logos | Yes | Yes | Yes |
| Price on a past date (what you paid) | No | Yes, 2 years back | Yes, 5 years back |

- **Nigerian (NGX) stocks are cheap.** One call a day prices the whole exchange, however
  many stocks people hold.
- **US stocks are not.** Each different US stock costs at least one call every day.
  Roughly 100 different US stocks across everyone on your server will use up the Free
  plan's month, before anyone browses the stock list. If you track many US stocks,
  you need Hobby or above.
- **On the Free plan, people type in the price they paid** when they add a stock bought
  on a past date (buying today uses the live price). Set `NGNMARKET_HISTORY_ENABLED=true`
  only once you are on Hobby or above; Silo then fills in the price for past dates itself.
- Set `NGNMARKET_REQUESTS_PER_MINUTE` to your plan's per-minute number so Silo paces itself
  and does not get blocked.

Three background jobs run inside the API every day, so you don't need an external
scheduler: auto-pilot rules, a stock price refresh (needs the NGN Market key) and a
currency rate refresh (needs the exchangerate-api key). With several API replicas, a database
lock makes sure each job runs once.

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

# Required — for FX rates (currency conversion across your portfolio).
# Get a free key at https://www.exchangerate-api.com — no card required.
# A background job refreshes rates once a day and caches them in Postgres;
# without a key, that job fails and conversion falls back to a slower
# live lookup per request.
EXCHANGERATE_API_KEY=<your-key>

# Required for stocks (Nigeria + US). Free plan: browse + current prices.
# Price history (what you paid on a past date) needs the Hobby plan or above.
# https://ngnmarket.com/developer
NGNMARKET_API_KEY=<your-ngnmarket-key>
NGNMARKET_REQUESTS_PER_MINUTE=30   # your plan's per-minute cap
NGNMARKET_HISTORY_ENABLED=false    # true only on Hobby or above (see the plans table above)
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
