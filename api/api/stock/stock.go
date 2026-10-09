// Package stock exposes the stock directory endpoint.
package stock

import (
	"strconv"

	"github.com/gin-gonic/gin"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appStock "github.com/wearegravitylabs/silo/api/app/stock"
)

const serviceName = "stock"

type handler struct{ svc appStock.Stock }

// New registers GET /stocks on the given (authenticated) router group.
func New(r *gin.RouterGroup, svc appStock.Stock) {
	h := &handler{svc: svc}
	r.GET("/stocks", h.list)
}

// list godoc
//
//	@Summary	Browse listed stocks for a market, with current price and logo
//	@Tags		stocks
//	@Param		country	query	string	true	"Market: NG (Nigerian Exchange, NGN) or US (USD)"
//	@Param		search	query	string	false	"Match on symbol or company name"
//	@Param		page	query	int		false	"Page, from 1 (default 1)"
//	@Param		limit	query	int		false	"Page size (default 50, max 100)"
//	@Success	200		{object}	stocks.Page
//	@Failure	400		"INVALID_COUNTRY"
//	@Failure	429		"MARKET_RATE_LIMITED: retry in a minute"
//	@Failure	503		"MARKET_QUOTA_EXCEEDED or MARKET_UNAVAILABLE: offer manual entry"
//	@Router		/stocks [get]
func (h *handler) list(c *gin.Context) {
	// Non-numeric paging values fall back to the defaults rather than erroring.
	page, _ := strconv.Atoi(c.Query("page"))
	limit, _ := strconv.Atoi(c.Query("limit"))

	res, err := h.svc.List(c.Request.Context(), c.Query("country"), c.Query("search"), page, limit)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, "stocks", res)
}
