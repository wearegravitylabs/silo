package debt

import (
	"github.com/gin-gonic/gin"
	appDebt "github.com/wearegravitylabs/silo/api/app/debt"
)

type handler struct{ svc appDebt.Debt }

// New registers debt routes.
func New(r *gin.RouterGroup, svc appDebt.Debt) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/debts")
	g.POST("", h.create)
	g.GET("", h.list)
	g.GET("/:id", h.get)
	g.PATCH("/:id", h.update)
	g.DELETE("/:id", h.delete)
	g.GET("/:id/amortization", h.amortizationSchedule)
}

func (h *handler) create(c *gin.Context)              { /* TODO */ }
func (h *handler) list(c *gin.Context)                { /* TODO */ }
func (h *handler) get(c *gin.Context)                 { /* TODO */ }
func (h *handler) update(c *gin.Context)              { /* TODO */ }
func (h *handler) delete(c *gin.Context)              { /* TODO */ }
func (h *handler) amortizationSchedule(c *gin.Context) { /* TODO */ }
