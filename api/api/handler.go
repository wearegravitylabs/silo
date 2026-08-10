// Package api wires all HTTP handlers and registers routes.
package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	"github.com/wearegravitylabs/silo/api/api/auth"
	"github.com/wearegravitylabs/silo/api/api/asset"
	"github.com/wearegravitylabs/silo/api/api/autopilot"
	"github.com/wearegravitylabs/silo/api/api/dashboard"
	"github.com/wearegravitylabs/silo/api/api/debt"
	"github.com/wearegravitylabs/silo/api/api/projection"
	"github.com/wearegravitylabs/silo/api/api/folder"
	"github.com/wearegravitylabs/silo/api/api/insight"
	"github.com/wearegravitylabs/silo/api/api/portfolio"
	"github.com/wearegravitylabs/silo/api/api/snapshot"
	apiUpload "github.com/wearegravitylabs/silo/api/api/upload"
	"github.com/wearegravitylabs/silo/api/api/user"
	"github.com/wearegravitylabs/silo/api/api/vault"
	appAuth "github.com/wearegravitylabs/silo/api/app/auth"
	appAsset "github.com/wearegravitylabs/silo/api/app/asset"
	appAutopilot "github.com/wearegravitylabs/silo/api/app/autopilot"
	appDebt "github.com/wearegravitylabs/silo/api/app/debt"
	appDocument "github.com/wearegravitylabs/silo/api/app/document"
	appFolder "github.com/wearegravitylabs/silo/api/app/folder"
	appDashboard "github.com/wearegravitylabs/silo/api/app/dashboard"
	appInsight "github.com/wearegravitylabs/silo/api/app/insight"
	appNote "github.com/wearegravitylabs/silo/api/app/note"
	appProjection "github.com/wearegravitylabs/silo/api/app/projection"
	appPortfolio "github.com/wearegravitylabs/silo/api/app/portfolio"
	appSnapshot "github.com/wearegravitylabs/silo/api/app/snapshot"
	appUser "github.com/wearegravitylabs/silo/api/app/user"
	appVault "github.com/wearegravitylabs/silo/api/app/vault"
	"github.com/wearegravitylabs/silo/api/pkg/assetclass"
	"github.com/wearegravitylabs/silo/api/pkg/currency"
	"github.com/wearegravitylabs/silo/api/pkg/environment"
	"github.com/wearegravitylabs/silo/api/pkg/helpers"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
	"github.com/wearegravitylabs/silo/api/pkg/physicalsubtype"
	objectStorage "github.com/wearegravitylabs/silo/api/thirdparty/storage"
)

// Handler is the root HTTP handler that owns all service references.
type Handler struct {
	env    *environment.Env
	engine *gin.Engine
	mid    *middleware.Middleware

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
	documentSvc   appDocument.Document
	noteSvc       appNote.Note
	projectionSvc  appProjection.Projection
	dashboardSvc   appDashboard.Dashboard
	objectStore    objectStorage.ObjectStorage
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
	documentSvc appDocument.Document,
	noteSvc appNote.Note,
	projectionSvc appProjection.Projection,
	dashboardSvc appDashboard.Dashboard,
	store objectStorage.ObjectStorage,
) *Handler {
	return &Handler{
		env: env, engine: engine, mid: mid,
		authSvc: authSvc, userSvc: userSvc, portfolioSvc: portfolioSvc,
		assetSvc: assetSvc, debtSvc: debtSvc, autopilotSvc: autopilotSvc,
		snapshotSvc: snapshotSvc, vaultSvc: vaultSvc, insightSvc: insightSvc,
		folderSvc: folderSvc, documentSvc: documentSvc, noteSvc: noteSvc,
		projectionSvc: projectionSvc, dashboardSvc: dashboardSvc, objectStore: store,
	}
}

// Build registers all routes on the Gin engine.
func (h *Handler) Build() {
	h.engine.GET("/", middleware.HealthCheck())

	v1 := h.engine.Group("/api/v1")

	// ── Tier 1: Public — no token required ───────────────────────────────────
	auth.New(v1, h.authSvc)
	v1.GET("/asset-classes", assetClassesHandler())
	v1.GET("/physical-subtypes", physicalSubtypesHandler())
	v1.GET("/currencies", currenciesHandler())

	// ── Tier 2: Authenticated + email verified ────────────────────────────────
	// User must have a valid JWT and a verified email address.
	// Onboarding itself lives here — you can't require onboarding to reach it.
	verified := v1.Group("", h.mid.RequireAuth(), h.mid.RequireEmailVerified())
	user.New(verified, h.userSvc)

	// ── Tier 3: Authenticated + fully onboarded ───────────────────────────────
	// Everything else requires a completed profile.
	// Upload lives here — only onboarded users can upload files.
	onboarded := v1.Group("", h.mid.RequireAuth(), h.mid.RequireOnboarded())
	apiUpload.New(onboarded, h.objectStore, h.env)
	portfolio.New(onboarded, h.portfolioSvc, h.mid)
	folder.New(onboarded, h.folderSvc, h.mid)
	asset.New(onboarded, h.assetSvc, h.documentSvc, h.noteSvc, h.mid)
	debt.New(onboarded, h.debtSvc, h.noteSvc, h.documentSvc, h.mid)
	autopilot.New(onboarded, h.autopilotSvc, h.mid)
	projection.New(onboarded, h.projectionSvc, h.mid)
	dashboard.New(onboarded, h.dashboardSvc, h.mid)
	snapshot.New(onboarded, h.snapshotSvc)
	vault.New(onboarded, h.vaultSvc, h.mid)
	insight.New(onboarded, h.insightSvc)

	// ── Internal — no user auth required, should be network-restricted in production ──
	internal := h.engine.Group("/internal")
	internal.POST("/autopilot/run", func(c *gin.Context) {
		if err := h.autopilotSvc.RunDue(c.Request.Context()); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"message": "autopilot rules executed"})
	})
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

// physicalSubtypesHandler returns the physical asset subtype catalogue.
// No auth required — static configuration data.
func physicalSubtypesHandler() gin.HandlerFunc {
	subtypes := physicalsubtype.All()
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, apiModel.APIResponse{
			Code:    http.StatusOK,
			Data:    subtypes,
			Message: helpers.StringPtr("physical subtypes"),
			Error:   nil,
		})
	}
}

// currenciesHandler returns the supported currency list with emoji flags.
// No auth required — this is static configuration data used by the FE
// to populate currency pickers (e.g. portfolio base currency selector).
func currenciesHandler() gin.HandlerFunc {
	// Pre-render at startup — the registry never changes at runtime.
	currencies := currency.All()

	return func(c *gin.Context) {
		c.JSON(http.StatusOK, apiModel.APIResponse{
			Code:    http.StatusOK,
			Data:    currencies,
			Message: helpers.StringPtr("currencies"),
			Error:   nil,
		})
	}
}
