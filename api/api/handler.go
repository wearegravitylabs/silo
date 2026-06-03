// Package api wires all HTTP handlers and registers routes.
package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	"github.com/wearegravitylabs/silo/api/api/auth"
	"github.com/wearegravitylabs/silo/api/api/asset"
	"github.com/wearegravitylabs/silo/api/api/autopilot"
	"github.com/wearegravitylabs/silo/api/api/debt"
	"github.com/wearegravitylabs/silo/api/api/folder"
	"github.com/wearegravitylabs/silo/api/api/insight"
	"github.com/wearegravitylabs/silo/api/api/portfolio"
	"github.com/wearegravitylabs/silo/api/api/snapshot"
	"github.com/wearegravitylabs/silo/api/api/user"
	"github.com/wearegravitylabs/silo/api/api/vault"
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
	"github.com/wearegravitylabs/silo/api/pkg/assetclass"
	"github.com/wearegravitylabs/silo/api/pkg/environment"
	"github.com/wearegravitylabs/silo/api/pkg/helpers"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

// Handler is the root HTTP handler that owns all service references.
type Handler struct {
	env   *environment.Env
	engine *gin.Engine
	mid   *middleware.Middleware

	authSvc      appAuth.Auth
	userSvc      appUser.User
	portfolioSvc appPortfolio.Portfolio
	assetSvc     appAsset.Asset
	debtSvc      appDebt.Debt
	autopilotSvc appAutopilot.Autopilot
	snapshotSvc  appSnapshot.Snapshot
	vaultSvc     appVault.Vault
	insightSvc   appInsight.Insight
	folderSvc    appFolder.Folder
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
	folderSvc appFolder.Folder,
) *Handler {
	return &Handler{
		env: env, engine: engine, mid: mid,
		authSvc: authSvc, userSvc: userSvc, portfolioSvc: portfolioSvc,
		assetSvc: assetSvc, debtSvc: debtSvc, autopilotSvc: autopilotSvc,
		snapshotSvc: snapshotSvc, vaultSvc: vaultSvc, insightSvc: insightSvc,
		folderSvc: folderSvc,
	}
}

// Build registers all routes on the Gin engine.
func (h *Handler) Build() {
	h.engine.GET("/", middleware.HealthCheck())

	v1 := h.engine.Group("/api/v1")

	// ── Tier 1: Public — no token required ───────────────────────────────────
	auth.New(v1, h.authSvc)
	v1.GET("/asset-classes", assetClassesHandler())

	// ── Tier 2: Authenticated + email verified ────────────────────────────────
	// User must have a valid JWT and a verified email address.
	// Onboarding itself lives here — you can't require onboarding to reach it.
	verified := v1.Group("", h.mid.RequireAuth(), h.mid.RequireEmailVerified())
	user.New(verified, h.userSvc)

	// ── Tier 3: Authenticated + fully onboarded ───────────────────────────────
	// Everything else requires a completed profile.
	onboarded := v1.Group("", h.mid.RequireAuth(), h.mid.RequireOnboarded())
	portfolio.New(onboarded, h.portfolioSvc, h.mid)
	folder.New(onboarded, h.folderSvc, h.mid)
	asset.New(onboarded, h.assetSvc)
	debt.New(onboarded, h.debtSvc)
	autopilot.New(onboarded, h.autopilotSvc)
	snapshot.New(onboarded, h.snapshotSvc)
	vault.New(onboarded, h.vaultSvc)
	insight.New(onboarded, h.insightSvc)
}

// assetClassesHandler returns the static asset class catalogue.
// No auth required — this is configuration data, not user data.
func assetClassesHandler() gin.HandlerFunc {
	// Pre-render the response once at startup — the list never changes at runtime.
	classes := assetclass.All()

	return func(c *gin.Context) {
		c.JSON(http.StatusOK, apiModel.APIResponse{
			Code:    http.StatusOK,
			Data:    classes,
			Message: helpers.StringPtr("asset classes"),
			Error:   nil,
		})
	}
}
