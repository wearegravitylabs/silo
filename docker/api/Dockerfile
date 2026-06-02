# ─── Build stage ─────────────────────────────────────────────────────────────
FROM golang:1.25-bookworm AS builder

WORKDIR /app

COPY api/go.mod api/go.sum ./
RUN go mod download

COPY api/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /silo-api .

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM gcr.io/distroless/static-debian12 AS runtime

COPY --from=builder /silo-api /silo-api

EXPOSE 8080
ENTRYPOINT ["/silo-api"]
