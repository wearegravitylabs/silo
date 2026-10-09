# Deploying Silo

This guide covers running Silo in **production** — on a managed platform (Render,
Northflank, Fly.io) or on your own server.

If you just want to run Silo locally with `docker compose`, read
[self-hosting.md](self-hosting.md) instead. That guide gets you to
`http://localhost:3000`; this one gets you to a real domain with real users.

---

## What Silo needs

| Dependency | Required? | What happens without it |
|---|---|---|
| PostgreSQL 14+ | **Yes** | The API logs `failed to connect to database` and exits at boot |
| Object storage (S3 / R2 / MinIO) | Recommended | `STORAGE_PROVIDER` empty → a no-op stub is used. Uploads appear to succeed but store nothing |
| Resend (email) | **Yes, in practice** | Magic-link sign-in is the only auth method in OSS Silo. No email = nobody can log in |
| exchangerate-api.com key | Recommended | The daily FX job fails. Multi-currency conversion falls back to a slower per-request lookup, then to a rate of 1.0 |
| Anthropic API key | Optional | AI insights are unavailable. Everything else works |
| Redis | **No** | `REDIS_URL` exists in `.env.example` but nothing reads it. Do not provision Redis |

The `uuid-ossp` Postgres extension is created by the first migration. Most managed
Postgres providers (Render, Neon, Supabase, RDS) allow this. If yours doesn't, create
the extension manually as a superuser before first boot.

---

## Architecture in production

Silo is two deployables:

| Artifact | Built from | Runs as |
|---|---|---|
| **API** | `docker/api/Dockerfile` | A container listening on `:8080` |
| **Web** | `cd web && npm ci && npm run build` | Static files in `web/dist`, served by any CDN or web server |

The API does **not** serve the frontend — there is no static-file route in the Gin
engine. The two are deployed separately and joined by a URL (see
[Connecting web to API](#connecting-web-to-api)).

### The API image

`docker/api/Dockerfile` is already production-grade: multi-stage, `CGO_ENABLED=0`,
`-ldflags="-s -w"`, and a `gcr.io/distroless/static-debian12` runtime with no shell
and no Go toolchain. You do not need a separate production Dockerfile.

**Build the image from the repository root**, not from `api/`:

```bash
docker build -f docker/api/Dockerfile -t silo-api:latest .
```

The Dockerfile does `COPY api/go.mod api/go.sum ./`, so the build context must be the
repo root. Pointing the context at `api/` will fail.

---

## Migrations

Migrations are **embedded in the binary** and run automatically on every boot, before
the HTTP server starts. There is no entrypoint script and no separate migration job.

```go
//go:embed migration/*.sql
var migrations embed.FS
```

Goose records every applied migration in a `goose_db_version` table. On startup it
compares that table against the embedded files and applies **only the ones that
haven't run yet**, in version order. Migrations that have already been applied are
skipped.

**This does not touch your existing data.** Migrations are forward-only here — `goose
Up` never runs the `-- +goose Down` half. The `Down` blocks exist for local
development (`make migrate-down`) and are never executed in production.

If a migration fails, the API logs `failed to run migrations` and exits rather than
serving traffic against a half-migrated schema. The container will crash-loop until
you fix it — which is the correct behaviour, but it means **a bad migration takes the
service down**, so test migrations against a copy of production first.

### Writing migrations that are safe to deploy

Every migration runs against a live database with real rows in it. Follow these rules:

- **Adding a column**: always give it a `DEFAULT` or make it nullable. `ADD COLUMN ...
  NOT NULL DEFAULT 0` is safe and fast on Postgres 11+ (no table rewrite).
- **Adding a column that derives from existing data**: add the column *and* backfill it
  in the same migration. A default of `0` on an existing table means every existing row
  reads as zero forever — the application only maintains the value going forward.
- **Dropping or renaming a column**: do it in two deploys. Ship the code that stops
  using it first, then drop it later. A single-step rename breaks every running replica
  the moment it lands.
- **Adding an index on a large table**: use `CREATE INDEX CONCURRENTLY`, and mark the
  migration `-- +goose NO TRANSACTION`, since `CONCURRENTLY` cannot run inside a
  transaction.

---

## Connecting web to API

`web/src/lib/api.ts` uses a **relative** base URL:

```ts
export const api = axios.create({ baseURL: '/api/v1' })
```

In development this works because of the Vite dev proxy in `web/vite.config.ts`. In
production the static bundle and the API are on different origins, so you need one of:

### Option A — reverse proxy (recommended)

Serve the static bundle and proxy `/api/*` to the API from the same hostname. No code
change, no CORS, no preflight requests.

Render static site:

```yaml
routes:
  - type: rewrite
    source: /api/*
    destination: https://silo-api.onrender.com/api/*
```

Nginx:

```nginx
location /api/ {
    proxy_pass https://silo-api.internal:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Caddy:

```
app.example.com {
    handle /api/* {
        reverse_proxy silo-api:8080
    }
    handle {
        root * /srv/silo/dist
        try_files {path} /index.html
        file_server
    }
}
```

### Option B — separate origins with CORS

Where no proxy is available, point the frontend at the API's own hostname by setting
`VITE_API_URL` **at build time**:

```bash
VITE_API_URL=https://api.example.com npm run build
```

The scheme is optional — a bare hostname is treated as `https`, so a value injected by
a platform's service discovery (Render's `fromService` with `property: host`, for
example) works without extra wiring. Leave the variable unset to keep the relative
base URL and use Option A.

Because this makes every call cross-origin, you must also set `CORS_ALLOWED_ORIGINS`
on the API to the frontend's origin, and each request pays a preflight. Prefer
Option A where you can.

`CORS_ALLOWED_ORIGINS` is a comma-separated list — `https://app.example.com,https://staging.example.com`
— and whitespace around each entry is trimmed. The origin must match exactly,
including scheme and port.

The value `*` allows any origin. Browsers only honour a wildcard when credentials are
disabled, so Silo turns `AllowCredentials` off in that case. Silo authenticates with a
Bearer header rather than cookies, so this still works — but prefer an explicit list in
production.

Whichever option you choose: the static bundle is a single-page app, so your host must
rewrite unknown paths to `index.html`, or deep links like `/dashboard` will 404 on
refresh.

---

## Environment variables

Set these on the API service. The frontend needs none at runtime (only `VITE_API_URL`
at build time, if you chose Option B).

### Required

| Key | Value |
|---|---|
| `PG_ADDRESS` | Postgres host |
| `PG_PORT` | Postgres port, usually `5432` |
| `PG_USER` | Postgres user |
| `PG_PASSWORD` | Postgres password |
| `PG_DATABASE` | Database name |
| `PG_SSL_MODE` | `require` for managed Postgres, `disable` for a local network |
| `JWT_SIGNING_SECRET` | 32-byte hex. Generate with `make genkey` |
| `ENCRYPTION_KEY` | 32-byte hex, AES-256. Generate with `make genkey` |
| `APP_ENV` | `production` — also switches Gin into release mode |
| `APP_BASE_URL` | Public URL of the frontend. Used to build magic-link URLs in emails |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins |
| `RESEND_API_KEY` | From [resend.com/api-keys](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | Must be on a domain you verified in Resend |

> **Silo builds its Postgres DSN from the discrete `PG_*` variables.** It does not read
> `DATABASE_URL`. If your platform only hands you a connection URL, split it into its
> parts — most platforms (Render included) also expose host/port/user/password/database
> as individual values.

> **Generate fresh secrets for production.** Never reuse the placeholder values from
> `api/.env.example`. Rotating `ENCRYPTION_KEY` after launch makes previously encrypted
> values unreadable, so set it once and keep it backed up.

### Recommended

| Key | Value |
|---|---|
| `EXCHANGERATE_API_KEY` | Free key from [exchangerate-api.com](https://www.exchangerate-api.com) — no card required |
| `SERVER_PORT` | `8080`. Defaults to `8080` if unset |
| `IS_SANDBOX_MODE` | **`false` in production.** When `true`, a fixed OTP is accepted as valid — leaving this on is an open door |
| `JWT_ACCESS_TOKEN_EXPIRY` | `15m` |
| `JWT_REFRESH_TOKEN_EXPIRY` | `30d` |
| `OTP_EXPIRY` | `10m` |
| `RESEND_FROM_NAME` | Display name on outgoing mail |
| `SUPPORT_EMAIL` | Shown to users in emails |

### Optional

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Enables AI insights |
| `CLAUDE_MODEL` | Defaults to the value in `.env.example` |
| `COINGECKO_API_KEY` | Higher rate limits for crypto prices. The free tier works without a key |
| `COINGECKO_BASE_URL` | Override for CoinGecko Pro |
| `YAHOO_FINANCE_BASE_URL` | Override for equity quotes |
| `EXCHANGERATE_BASE_URL` | Override the FX provider base URL |
| `STORAGE_*` | See below |

---

## Object storage

Silo stores asset images, documents and vault files in S3-compatible storage. It uses
**two buckets**:

- `STORAGE_BUCKET` — public-read objects (asset images, avatars)
- `STORAGE_PRIVATE_BUCKET` — documents and vault files, reachable only through
  presigned URLs. Defaults to `{STORAGE_BUCKET}-docs`

Both are created on first boot if the credentials have permission to create buckets.
If your credentials are scoped to existing buckets only, create both yourself first.

`STORAGE_PROVIDER` selects the backend: `s3`, `r2`, or `minio`. **If it is empty, Silo
silently uses a no-op stub** — the server boots fine and uploads return success, but
nothing is stored. Always set it in production.

### Cloudflare R2 (recommended)

Zero egress fees, S3-compatible, no server to run. Best choice for most deployments.

1. Create a bucket at **dash.cloudflare.com → R2**.
2. Create an API token with object read/write permissions.
3. Enable **Public access** on the public bucket to get a `pub-*.r2.dev` URL, or
   attach a custom domain.

```bash
STORAGE_PROVIDER=r2
STORAGE_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=<r2_access_key_id>
STORAGE_SECRET_KEY=<r2_secret_access_key>
STORAGE_BUCKET=silo
STORAGE_PRIVATE_BUCKET=silo-docs
STORAGE_PUBLIC_URL=https://pub-<token>.r2.dev
```

### AWS S3

```bash
STORAGE_PROVIDER=s3
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=<aws_access_key_id>
STORAGE_SECRET_KEY=<aws_secret_access_key>
STORAGE_BUCKET=silo
STORAGE_PRIVATE_BUCKET=silo-docs
STORAGE_PUBLIC_URL=https://silo.s3.amazonaws.com
```

`STORAGE_ENDPOINT` stays empty for AWS — the SDK resolves the regional endpoint
itself. The IAM user needs `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, and
`s3:CreateBucket` if you want the buckets created automatically.

### MinIO

MinIO is the default in `docker-compose.yml` and is fine for local development. Running
it in **production** is a real commitment — you own the uptime, the disk, and the
backups of every document your users upload.

If you do run it in production:

```bash
STORAGE_PROVIDER=minio
STORAGE_ENDPOINT=http://minio:9000          # internal address the API dials
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=<strong-random-value>
STORAGE_SECRET_KEY=<strong-random-value>
STORAGE_BUCKET=silo
STORAGE_PRIVATE_BUCKET=silo-docs
STORAGE_PUBLIC_URL=https://storage.example.com/silo
```

- **Change the credentials.** `minioadmin` / `minioadmin` is a development default.
- **`STORAGE_PUBLIC_URL` must be reachable from your users' browsers.** This is the
  single most common production mistake: leaving it as `http://localhost:9000/silo`
  means every image URL Silo hands out points at the user's own machine. Put MinIO
  behind a real hostname with TLS.
- `STORAGE_ENDPOINT` (server-to-server) and `STORAGE_PUBLIC_URL` (browser-facing) are
  usually different addresses. That's expected.
- Back up the MinIO volume. Nothing else does it for you.

MinIO uses path-style addressing automatically (`ForcePathStyle: true`); R2 and S3 use
virtual-host style. You don't need to configure this.

---

## Platform guides

### Render

A ready-made blueprint lives at [`render.yaml`](../render.yaml) in the repo root. In
the Render dashboard: **New → Blueprint**, point it at your fork. It creates
`silo-api` (Docker web service), `silo-web` (static site) and `silo-postgres`
(managed Postgres).

Then, in the dashboard:

1. Fill in every variable marked `sync: false` — Resend, R2 credentials,
   `EXCHANGERATE_API_KEY`, `ENCRYPTION_KEY`.
2. Set `APP_BASE_URL` to the `silo-web` URL once it has deployed.
3. Confirm the `/api/*` rewrite in `render.yaml` points at `silo-api`'s **actual**
   hostname. Render only assigns `<name>.onrender.com` when that subdomain is free;
   otherwise it appends a suffix.

Notes on why the blueprint looks the way it does:

- `dockerfilePath: ./docker/api/Dockerfile` with `dockerContext: .` — the Dockerfile
  copies `api/go.mod`, so the context must be the repo root
- Postgres is wired with `fromDatabase` using `property: host`, `port`, `user`,
  `password`, `database` — **not** `connectionString`, since Silo reads discrete vars
- `JWT_SIGNING_SECRET` uses `generateValue: true` — it's consumed as raw bytes
- **`ENCRYPTION_KEY` is not auto-generated.** It is hex-decoded into a 256-bit AES key,
  so it must be exactly 64 hex characters. Render's generated values aren't hex and
  will fail at decode time. Run `make genkey` and paste the value in
- The free Postgres plan is deleted after 30 days — move to a paid plan before storing
  anything real

### Northflank

A good fit if you want MinIO inside the same project.

1. **Create project** → pick a region.
2. **Addons → PostgreSQL**. Map the exposed host/port/user/password/database secrets to
   the `PG_*` variables.
3. **Addons → MinIO** (optional) → gives an internal endpoint and root credentials.
4. **Services → Create service → Build & Deploy from Git**:
   - Build type **Dockerfile**, path `/docker/api/Dockerfile`, context `/`
   - Port `8080`, HTTP, public DNS enabled
   - Health check: HTTP `GET /` on port 8080
5. Deploy the frontend as a static site from `web/dist` with a `/api/*` proxy rule.

### Fly.io

```bash
fly launch --dockerfile docker/api/Dockerfile --no-deploy
fly postgres create --name silo-db
fly postgres attach silo-db
```

`fly postgres attach` sets `DATABASE_URL`, which **Silo does not read**. Decompose it
into the `PG_*` variables with `fly secrets set`.

Set `internal_port = 8080` in `fly.toml`, and add an HTTP health check on `/`.

### Your own server

The simplest production setup is Docker Compose plus a reverse proxy that terminates
TLS. Starting from the bundled `docker-compose.yml`:

- Remove the `redis` service — nothing uses it.
- Remove the published `ports:` on `postgres` and `minio` so they are reachable only on
  the internal Docker network. Only the proxy should be exposed to the internet.
- Replace every default password (`silo`/`silo`, `minioadmin`/`minioadmin`).
- Add a `restart: unless-stopped` policy to each service.
- Build the frontend with `npm run build` and serve `web/dist` from the proxy.
- Put Caddy or Nginx in front for TLS and the `/api/*` route (config above).

A 2 vCPU / 4 GB box handles a small deployment comfortably.

---

## Operating Silo

### Health checks

`GET /` returns a liveness response. Point your platform's health check at it.

It is a **liveness** check, not a readiness check — it does not verify the database
connection. Since the API exits at boot when Postgres is unreachable, a crash-looping
container is the signal that the database is down.

### Scheduled jobs

The API runs two `@daily` jobs in-process:

| Job | What it does |
|---|---|
| `autopilot-run-due` | Executes due autopilot rules |
| `fx-rate-refresh` | Refreshes cached FX rates from exchangerate-api.com |

Each tick is guarded by a **Postgres advisory lock**, so running multiple replicas is
safe — only one replica executes a given job per tick. You do not need a separate
worker service or an external cron.

FX rates are also warmed once at boot, on a best-effort basis. A failure there is
logged as a warning and never blocks startup.

### Scaling

The API is stateless apart from Postgres and object storage, so horizontal scaling
works without extra configuration. Scale Postgres connections with your replica count —
GORM's default pool is per-process.

### Backups

Your database is the only irreplaceable thing. Object storage is second.

```bash
# Managed Postgres: use the provider's automated backups, and verify a restore
# at least once before you need it.

# Self-hosted:
docker compose exec postgres pg_dump -U silo silo | gzip > silo-$(date +%F).sql.gz

# Restore:
gunzip -c silo-2026-10-02.sql.gz | docker compose exec -T postgres psql -U silo silo
```

If you self-host MinIO, back up its data volume too — `mc mirror` to a remote bucket
is the usual approach.

### Upgrading

```bash
git pull
docker compose build
docker compose up -d
```

Migrations run automatically on the new container's first boot. Watch the logs for
`migrations applied` before sending traffic.

Take a database backup before any upgrade that includes migrations.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Container exits immediately, `failed to connect to database` | Wrong `PG_*` values, or `PG_SSL_MODE` doesn't match what the server requires. Managed Postgres almost always needs `require` |
| Container exits, `failed to run migrations` | A migration failed. Check the logs for the SQL error — the schema is left at the last successful version |
| Frontend loads, every API call 404s | The `/api/*` proxy rule is missing. See [Connecting web to API](#connecting-web-to-api) |
| API calls blocked by CORS | `CORS_ALLOWED_ORIGINS` doesn't exactly match the browser's origin — including scheme and port. A disallowed origin gets a `403` on the preflight |
| Deep links 404 on refresh | The static host isn't rewriting unknown paths to `index.html` |
| Uploads "succeed" but files never appear | `STORAGE_PROVIDER` is empty, so the no-op stub is active |
| Images return broken links | `STORAGE_PUBLIC_URL` isn't reachable from the browser — commonly still `localhost` |
| No sign-in emails | `RESEND_API_KEY` unset, or `RESEND_FROM_EMAIL` is on a domain not verified in Resend |
| Wrong totals in a second currency | `EXCHANGERATE_API_KEY` unset, so the FX cache is empty and conversion falls back to 1.0 |
| Anyone can sign in with a fixed code | `IS_SANDBOX_MODE` is still `true`. Set it to `false` |

---

## Security checklist

Before you point a domain at it:

- [ ] `IS_SANDBOX_MODE=false`
- [ ] `APP_ENV=production`
- [ ] `JWT_SIGNING_SECRET` and `ENCRYPTION_KEY` freshly generated with `make genkey`,
      not copied from `.env.example`, and backed up somewhere safe
- [ ] `PG_SSL_MODE=require` for any database reached over a public network
- [ ] Default passwords replaced (`silo`/`silo`, `minioadmin`/`minioadmin`)
- [ ] Postgres and MinIO not published to the public internet
- [ ] TLS terminated in front of the API and the frontend
- [ ] `CORS_ALLOWED_ORIGINS` set to your exact frontend origin(s), not `*`
- [ ] `STORAGE_PRIVATE_BUCKET` is genuinely private — no public-read policy
- [ ] Database backups running, and a restore tested

See [SECURITY.md](../SECURITY.md) for reporting vulnerabilities.
