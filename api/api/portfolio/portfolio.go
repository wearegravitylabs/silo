package portfolio

import (
	"github.com/gin-gonic/gin"
	appPortfolio "github.com/wearegravitylabs/silo/api/app/portfolio"
)

type handler struct{ svc appPortfolio.Portfolio }

// New registers portfolio routes.
func New(r *gin.RouterGroup, svc appPortfolio.Portfolio) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios")
	g.POST("", h.create)
	g.GET("", h.list)
	g.GET("/:id", h.get)
	g.PATCH("/:id", h.update)
	g.DELETE("/:id", h.delete)
	g.POST("/:id/members", h.addMember)
	g.DELETE("/:id/members/:userID", h.removeMember)
}

func (h *handler) create(c *gin.Context)      { /* TODO */ }
func (h *handler) list(c *gin.Context)        { /* TODO */ }
func (h *handler) get(c *gin.Context)         { /* TODO */ }
func (h *handler) update(c *gin.Context)      { /* TODO */ }
func (h *handler) delete(c *gin.Context)      { /* TODO */ }
func (h *handler) addMember(c *gin.Context)   { /* TODO */ }
func (h *handler) removeMember(c *gin.Context) { /* TODO */ }
