# ─── Build stage ─────────────────────────────────────────────────────────────
FROM golang:1.25-bookworm AS builder

WORKDIR /app

# How many packages the compiler builds at once. Each is its own process with
# its own memory, so the default — one per core — is what makes this step swap
# and crawl on a small builder. Raise it on a machine with headroom:
#   docker build --build-arg GO_BUILD_PARALLELISM=8 ...
ARG GO_BUILD_PARALLELISM=2

COPY api/go.mod api/go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY api/ ./

# The two cache mounts are what make a redeploy quick. Without them every build
# recompiles the whole dependency tree — the AWS, Stripe, gin and gorm trees are
# most of the work, and none of them change between deploys.
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build \
      -p=${GO_BUILD_PARALLELISM} \
      -trimpath -ldflags="-s -w" \
      -o /silo-api .

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM gcr.io/distroless/static-debian12 AS runtime

COPY --from=builder /silo-api /silo-api

EXPOSE 8080
ENTRYPOINT ["/silo-api"]
