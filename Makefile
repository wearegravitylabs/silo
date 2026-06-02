GO := /opt/homebrew/Cellar/go/1.22.5/libexec/bin/go
API_DIR := api

.PHONY: dev test lint build migrate-up migrate-down mock genkey web-dev web-build web-typecheck docker-up docker-down

# ─── Backend ──────────────────────────────────────────────────────────────────

dev:
	cd $(API_DIR) && $(GO) run main.go

build:
	cd $(API_DIR) && $(GO) build -ldflags="-s -w" -o bin/silo .

test:
	cd $(API_DIR) && $(GO) test ./... -race -count=1

lint:
	cd $(API_DIR) && golangci-lint run --config=.golangci.yml --timeout=5m

vet:
	cd $(API_DIR) && $(GO) vet ./...

mock:
	cd $(API_DIR) && $(GO) generate ./...

genkey:
	cd $(API_DIR) && $(GO) run ./terminal/genkey

migrate-up:
	cd $(API_DIR) && $(GO) run ./terminal/goose up

migrate-down:
	cd $(API_DIR) && $(GO) run ./terminal/goose down

migrate-status:
	cd $(API_DIR) && $(GO) run ./terminal/goose status

# ─── Frontend ─────────────────────────────────────────────────────────────────

web-dev:
	cd web && npm run dev

web-build:
	cd web && npm run build

web-typecheck:
	cd web && npm run typecheck

web-install:
	cd web && npm install

# ─── Docker ───────────────────────────────────────────────────────────────────

docker-up:
	docker compose up --build

docker-down:
	docker compose down

docker-clean:
	docker compose down -v
