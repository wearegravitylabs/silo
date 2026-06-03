// Package main is the entrypoint for the Silo API server.
package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/requestid"
	"github.com/gin-gonic/gin"

	"github.com/wearegravitylabs/silo/api/api"
	"github.com/wearegravitylabs/silo/api/app"
	appAuth "github.com/wearegravitylabs/silo/api/app/auth"
	appAsset "github.com/wearegravitylabs/silo/api/app/asset"
	appAutopilot "github.com/wearegravitylabs/silo/api/app/autopilot"
	appDebt "github.com/wearegravitylabs/silo/api/app/debt"
	appFolder "github.com/wearegravitylabs/silo/api/app/folder"
	appInsight "github.com/wearegravitylabs/silo/api/app/insight"
	appPortfolio "github.com/wearegravitylabs/silo/api/app/portfolio"
	appSnapshot "github.com/wearegravitylabs/silo/api/app/snapshot"
	appUser "github.com/wearegravitylabs/silo/api/app/user"
	appVault "github.com/wearegravitylabs/silo/api/app/vault"
	modelEnv "github.com/wearegravitylabs/silo/api/model/env"
	"github.com/wearegravitylabs/silo/api/pkg/environment"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
	"github.com/wearegravitylabs/silo/api/store"
)

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

	// ─── Dependency Injection ─────────────────────────────────────────────────────
	dp := app.InitDp(storage, env)

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

	// ─── HTTP Engine ─────────────────────────────────────────────────────────────
	engine := gin.New()
	engine.ContextWithFallback = true

	mid := middleware.New(env)

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
		folderSvc,
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
