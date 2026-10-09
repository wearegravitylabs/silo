// Package main is the entrypoint for the Silo API server.
package main

import (
	"context"
	"embed"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/requestid"
	"github.com/gin-gonic/gin"
	"github.com/pressly/goose/v3"

	"github.com/wearegravitylabs/silo/api/api"
	"github.com/wearegravitylabs/silo/api/app"
	appAsset "github.com/wearegravitylabs/silo/api/app/asset"
	appAuth "github.com/wearegravitylabs/silo/api/app/auth"
	appAutopilot "github.com/wearegravitylabs/silo/api/app/autopilot"
	appDashboard "github.com/wearegravitylabs/silo/api/app/dashboard"
	appDebt "github.com/wearegravitylabs/silo/api/app/debt"
	appDocument "github.com/wearegravitylabs/silo/api/app/document"
	appExchangeRate "github.com/wearegravitylabs/silo/api/app/exchangerate"
	appFolder "github.com/wearegravitylabs/silo/api/app/folder"
	appInsight "github.com/wearegravitylabs/silo/api/app/insight"
	appNote "github.com/wearegravitylabs/silo/api/app/note"
	appPortfolio "github.com/wearegravitylabs/silo/api/app/portfolio"
	appProjection "github.com/wearegravitylabs/silo/api/app/projection"
	appSnapshot "github.com/wearegravitylabs/silo/api/app/snapshot"
	appStock "github.com/wearegravitylabs/silo/api/app/stock"
	appUser "github.com/wearegravitylabs/silo/api/app/user"
	appVault "github.com/wearegravitylabs/silo/api/app/vault"
	modelEnv "github.com/wearegravitylabs/silo/api/model/env"
	"github.com/wearegravitylabs/silo/api/pkg/environment"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
	"github.com/wearegravitylabs/silo/api/pkg/scheduler"
	"github.com/wearegravitylabs/silo/api/store"
)

//go:embed migration/*.sql
var migrations embed.FS

func main() {
	log := siloLogger.New()

	// ─── Configuration ───────────────────────────────────────────────────────────
	env, err := environment.New()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to load environment")
	}

	if env.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	// ─── Data Layer ───────────────────────────────────────────────────────────────
	storage := store.New(env)

	// ─── Migrations ───────────────────────────────────────────────────────────────
	sqlDB, err := storage.DB.DB()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to get sql.DB for migrations")
	}
	goose.SetBaseFS(migrations)
	goose.SetLogger(goose.NopLogger())
	if err := goose.Up(sqlDB, "migration"); err != nil {
		log.Fatal().Err(err).Msg("failed to run migrations")
	}
	log.Info().Msg("migrations applied")

	// ─── Dependency Injection ─────────────────────────────────────────────────────
	dp := app.InitDp(context.Background(), storage, env)

	// ─── Services ─────────────────────────────────────────────────────────────────
	authSvc := appAuth.New(dp)
	userSvc := appUser.New(dp)
	portfolioSvc := appPortfolio.New(dp)
	assetSvc := appAsset.New(dp)
	debtSvc := appDebt.New(dp)
	autopilotSvc := appAutopilot.New(dp)
	snapshotSvc := appSnapshot.New(dp)
	vaultSvc := appVault.New(dp)
	insightSvc := appInsight.New(dp)
	folderSvc := appFolder.New(dp)
	documentSvc := appDocument.New(dp)
	noteSvc := appNote.New(dp)
	projectionSvc := appProjection.New(dp)
	dashboardSvc := appDashboard.New(dp)
	exchangeRateSvc := appExchangeRate.New(dp)
	stockSvc := appStock.New(dp)

	// ─── Scheduler ────────────────────────────────────────────────────────────────
	// In-process cron. Runs in every replica, but each tick is guarded by a
	// Postgres advisory lock (see pkg/scheduler) so only one replica executes
	// a given job at a time.
	sched := scheduler.New(storage.DB)
	if err := sched.Register("autopilot-run-due", "@daily", autopilotSvc.RunDue); err != nil {
		log.Fatal().Err(err).Msg("failed to register autopilot scheduler job")
	}
	if err := sched.Register("fx-rate-refresh", "@daily", exchangeRateSvc.RefreshRates); err != nil {
		log.Fatal().Err(err).Msg("failed to register fx-rate-refresh scheduler job")
	}
	// Daily stock prices: refreshes every stock_ticker asset (NG + US) and records
	// a value-history point. No-op when no NGNMARKET_API_KEY is configured.
	if err := sched.Register("price-refresh", "@daily", assetSvc.RefreshAllPrices); err != nil {
		log.Fatal().Err(err).Msg("failed to register price-refresh scheduler job")
	}
	sched.Start()
	defer sched.Stop()

	// Warm the FX cache once at boot so it isn't empty until the first @daily
	// tick fires — best-effort, never fatal (asset FX conversion falls back to
	// a live lookup, then to 1.0, if the cache is empty; see app/asset fetchRateMap).
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		if err := exchangeRateSvc.RefreshRates(ctx); err != nil {
			log.Warn().Err(err).Msg("initial FX rate warm-up failed, will retry on next scheduled tick")
		}
	}()

	// ─── HTTP Engine ─────────────────────────────────────────────────────────────
	engine := gin.New()
	engine.ContextWithFallback = true

	mid := middleware.New(env, store.NewPortfolioStore(storage), store.NewUserStore(storage))

	engine.Use(
		mid.CORSMiddleware(),
		gin.Recovery(),
		requestid.New(),
		mid.LoggerMiddleware(),
	)

	handler := api.New(
		env, engine, mid,
		authSvc, userSvc, portfolioSvc,
		assetSvc, debtSvc, autopilotSvc,
		snapshotSvc, vaultSvc, insightSvc,
		folderSvc, documentSvc, noteSvc, projectionSvc, dashboardSvc, dp.ObjectStorage,
		dp.ExchangeRateStore,
		stockSvc,
	)
	handler.Build()

	// ─── HTTP Server ─────────────────────────────────────────────────────────────
	port := env.GetWithDefault(modelEnv.ServerPort, "8080")
	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           engine,
		ReadHeaderTimeout: 30 * time.Second,
	}

	go func() {
		log.Info().Str("port", port).Msg("starting silo api")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server error")
		}
	}()

	// ─── Graceful Shutdown ────────────────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit

	log.Info().Str("signal", sig.String()).Msg("shutting down")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("server shutdown error")
		os.Exit(1)
	}

	log.Info().Msg("server stopped")
}
