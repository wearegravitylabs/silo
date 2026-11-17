package snapshot

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appSnapshot "github.com/wearegravitylabs/silo/api/app/snapshot"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

const serviceName = "snapshot"

type handler struct{ svc appSnapshot.Snapshot }

// New registers snapshot routes under /portfolios/:portfolioID/snapshots.
// Snapshots are taken once a day by the snapshot-capture scheduler job.
func New(r *gin.RouterGroup, svc appSnapshot.Snapshot, mid *middleware.Middleware) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/snapshots", mid.RequirePortfolioMember())
	g.GET("", h.list)
	g.GET("/latest", h.latest)
}

// list returns snapshots between ?from and ?to (RFC 3339), oldest first.
// Defaults to the last year.
func (h *handler) list(c *gin.Context) {
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	to := time.Now().UTC()
	from := to.AddDate(-1, 0, 0)
	if raw := c.Query("from"); raw != "" {
		t, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
			return
		}
		from = t
	}
	if raw := c.Query("to"); raw != "" {
		t, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
			return
		}
		to = t
	}
	snapshots, err := h.svc.List(c.Request.Context(), portfolioID, from, to)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "snapshots", snapshots)
}

// latest returns the most recent snapshot, or null when none has been taken yet.
func (h *handler) latest(c *gin.Context) {
	portfolioID, ok := parsePortfolioID(c)
	if !ok {
		return
	}
	snapshot, err := h.svc.Latest(c.Request.Context(), portfolioID)
	if siloErrors.IsNotFound(err) {
		apiModel.OK(c, "snapshot", nil)
		return
	}
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "snapshot", snapshot)
}

func parsePortfolioID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("portfolioID"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return uuid.Nil, false
	}
	return id, true
}
