// Package api wires all HTTP handlers and registers routes.
package api

import (
	"github.com/gin-gonic/gin"

	"github.com/wearegravitylabs/silo/api/api/auth"
	"github.com/wearegravitylabs/silo/api/api/asset"
	"github.com/wearegravitylabs/silo/api/api/autopilot"
	"github.com/wearegravitylabs/silo/api/api/debt"
	"github.com/wearegravitylabs/silo/api/api/insight"
	"github.com/wearegravitylabs/silo/api/api/portfolio"
	"github.com/wearegravitylabs/silo/api/api/snapshot"
	"github.com/wearegravitylabs/silo/api/api/user"
	"github.com/wearegravitylabs/silo/api/api/vault"
	appAuth "github.com/wearegravitylabs/silo/api/app/auth"
	appAsset "github.com/wearegravitylabs/silo/api/app/asset"
	appAutopilot "github.com/wearegravitylabs/silo/api/app/autopilot"
	appDebt "github.com/wearegravitylabs/silo/api/app/debt"
	appInsight "github.com/wearegravitylabs/silo/api/app/insight"
	appPortfolio "github.com/wearegravitylabs/silo/api/app/portfolio"
	appSnapshot "github.com/wearegravitylabs/silo/api/app/snapshot"
	appUser "github.com/wearegravitylabs/silo/api/app/user"
	appVault "github.com/wearegravitylabs/silo/api/app/vault"
	"github.com/wearegravitylabs/silo/api/pkg/environment"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

// Handler is the root HTTP handler that owns all service references.
type Handler struct {
	env       *environment.Env
	engine    *gin.Engine
	mid       *middleware.Middleware

	authSvc      appAuth.Auth
	userSvc      appUser.User
	portfolioSvc appPortfolio.Portfolio
	assetSvc     appAsset.Asset
	debtSvc      appDebt.Debt
	autopilotSvc appAutopilot.Autopilot
	snapshotSvc  appSnapshot.Snapshot
	vaultSvc     appVault.Vault
	insightSvc   appInsight.Insight
}

// New creates a Handler with all dependencies injected.
func New(
	env *environment.Env,
	engine *gin.Engine,
	mid *middleware.Middleware,
	authSvc appAuth.Auth,
	userSvc appUser.User,
	portfolioSvc appPortfolio.Portfolio,
	assetSvc appAsset.Asset,
	debtSvc appDebt.Debt,
	autopilotSvc appAutopilot.Autopilot,
	snapshotSvc appSnapshot.Snapshot,
	vaultSvc appVault.Vault,
	insightSvc appInsight.Insight,
) *Handler {
	return &Handler{
		env: env, engine: engine, mid: mid,
		authSvc: authSvc, userSvc: userSvc, portfolioSvc: portfolioSvc,
		assetSvc: assetSvc, debtSvc: debtSvc, autopilotSvc: autopilotSvc,
		snapshotSvc: snapshotSvc, vaultSvc: vaultSvc, insightSvc: insightSvc,
	}
}

// Build registers all routes on the Gin engine.
func (h *Handler) Build() {
	h.engine.GET("/", middleware.HealthCheck())

	v1 := h.engine.Group("/api/v1")

	// Public routes (no auth required)
	auth.New(v1, h.authSvc)

	// Protected routes
	protected := v1.Group("", h.mid.RequireAuth())
	user.New(protected, h.userSvc)
	portfolio.New(protected, h.portfolioSvc)
	asset.New(protected, h.assetSvc)
	debt.New(protected, h.debtSvc)
	autopilot.New(protected, h.autopilotSvc)
	snapshot.New(protected, h.snapshotSvc)
	vault.New(protected, h.vaultSvc)
	insight.New(protected, h.insightSvc)
}
