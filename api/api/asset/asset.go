package asset

import (
	"github.com/gin-gonic/gin"
	appAsset "github.com/wearegravitylabs/silo/api/app/asset"
)

type handler struct{ svc appAsset.Asset }

// New registers asset routes under /portfolios/:portfolioID/assets.
func New(r *gin.RouterGroup, svc appAsset.Asset) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/assets")
	g.POST("", h.create)
	g.GET("", h.list)
	g.GET("/:id", h.get)
	g.PATCH("/:id", h.update)
	g.DELETE("/:id", h.delete)
	g.POST("/:id/refresh-price", h.refreshPrice)
}

func (h *handler) create(c *gin.Context)       { /* TODO */ }
func (h *handler) list(c *gin.Context)         { /* TODO */ }
func (h *handler) get(c *gin.Context)          { /* TODO */ }
func (h *handler) update(c *gin.Context)       { /* TODO */ }
func (h *handler) delete(c *gin.Context)       { /* TODO */ }
func (h *handler) refreshPrice(c *gin.Context) { /* TODO */ }
