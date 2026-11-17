// Package fx converts amounts into a portfolio's base currency.
//
// Every place that adds up money across assets and debts goes through a
// Converter, so totals never mix currencies. Rates come from the daily cache
// (app/exchangerate); only today's rates are kept, so past values are
// converted at today's rate too.
package fx

import (
	"context"
	"math"
	"strings"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/pkg/currency"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

// Converter converts into one target currency and remembers each rate it has
// looked up. It is meant for one request or one job; it is not safe for
// concurrent use.
type Converter struct {
	dp    app.Dependency
	to    currency.Code
	rates map[string]float64
}

// New returns a Converter into the given currency.
func New(dp app.Dependency, to currency.Code) *Converter {
	return &Converter{dp: dp, to: strings.ToUpper(to), rates: map[string]float64{}}
}

// To is the currency everything is converted into.
func (c *Converter) To() currency.Code { return c.to }

// Rate returns how many units of the target currency one unit of from is
// worth. It tries the daily cache, then a live lookup, and falls back to 1.0
// (logged) when neither has the pair.
func (c *Converter) Rate(ctx context.Context, from currency.Code) float64 {
	from = strings.ToUpper(from)
	if from == "" || from == c.to {
		return 1.0
	}
	if rate, ok := c.rates[from]; ok {
		return rate
	}
	rate, err := c.dp.ExchangeRateStore.GetRate(ctx, from, c.to)
	if err != nil && c.dp.StockMarket != nil {
		rate, err = c.dp.StockMarket.GetExchangeRate(ctx, from, c.to)
	}
	if err != nil || rate <= 0 {
		log := siloLogger.FromCtx(ctx)
		log.Warn().Err(err).Str("from", from).Str("to", c.to).
			Msg("FX rate lookup failed — counting at 1.0")
		rate = 1.0
	}
	c.rates[from] = rate
	return rate
}

// Convert returns amount (in from) in the target currency.
func (c *Converter) Convert(ctx context.Context, amount float64, from currency.Code) float64 {
	return amount * c.Rate(ctx, from)
}

// Round2 rounds to 2 decimal places, the precision every money field uses.
func Round2(v float64) float64 { return math.Round(v*100) / 100 }

// ChangePct is the change from old to now as a percentage of old, rounded to
// 2 places. It is nil when old is 0, where a percentage means nothing.
func ChangePct(old, now float64) *float64 {
	if old == 0 {
		return nil
	}
	pct := Round2((now - old) / math.Abs(old) * 100)
	return &pct
}
