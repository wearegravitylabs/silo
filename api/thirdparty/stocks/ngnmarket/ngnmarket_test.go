package ngnmarket

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	sdk "github.com/wearegravitylabs/ngnmarket-go/api"

	"github.com/wearegravitylabs/silo/api/thirdparty/stocks"
)

const ngxBody = `{"success":true,"data":{"data":[
 {"symbol":"DANGCEM","name":"DANGOTE CEMENT PLC","sector":"Industrials","logo_url":"https://x/DANGCEM.png","price":700,"prev_close":690,"price_change_percent":1.45,"market_cap":9000000,"last_updated":"2026-10-07T15:40:06.000Z"},
 {"symbol":"GTCO","name":"GUARANTY TRUST HOLDING CO PLC","sector":"Financials","price":55.4,"prev_close":55,"price_change_percent":0.7,"market_cap":5000000},
 {"symbol":"MTNN","name":"MTN NIGERIA COMMUNICATIONS PLC","sector":"ICT","price":198.5,"prev_close":200,"price_change_percent":-0.75,"market_cap":7000000}],
 "pagination":{"page":1,"has_next":false}}}`

const usBody = `{"success":true,"data":{"data":[{"symbol":"MSFT","name":"MICROSOFT CORP","security_type":"stock","last_price":529.76,"prev_close":529.3,"change_pct":0.0869,"market_cap":3933756979312.16,"is_delayed":1,"quote_time":"2026-10-07T20:00:00.000Z"}],"pagination":{"page":1,"total":1,"has_next":false}}}`

// fakeAPI serves NGX and US fixtures and counts requests per route.
type fakeAPI struct {
	srv               *httptest.Server
	ngxCalls, usCalls atomic.Int32
	chartCalls        atomic.Int32
	failAll           atomic.Bool
	chartStatus       int
	chartBody         string
}

// newFake returns a fake API and a Provider with history lookups enabled.
func newFake(t *testing.T) (*fakeAPI, *Provider) {
	t.Helper()
	return newFakeHistory(t, true)
}

func newFakeHistory(t *testing.T, history bool) (*fakeAPI, *Provider) {
	t.Helper()
	f := &fakeAPI{chartStatus: 200}
	f.srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case f.failAll.Load():
			w.WriteHeader(429)
			w.Write([]byte(`{"success":false,"error":{"code":"RATE_LIMITED","message":"slow"}}`))
		case r.URL.Path == "/companies":
			f.ngxCalls.Add(1)
			w.Write([]byte(ngxBody))
		case r.URL.Path == "/us/tickers":
			f.usCalls.Add(1)
			w.Write([]byte(usBody))
		default: // *.../chart
			f.chartCalls.Add(1)
			w.WriteHeader(f.chartStatus)
			w.Write([]byte(f.chartBody))
		}
	}))
	t.Cleanup(f.srv.Close)
	c, err := sdk.New("k", sdk.WithBaseURL(f.srv.URL), sdk.WithHTTPClient(f.srv.Client()), sdk.WithMaxRetries(0))
	if err != nil {
		t.Fatal(err)
	}
	return f, NewWithClient(c, history)
}

func TestNG_WholeMarketIsOneCall(t *testing.T) {
	f, p := newFake(t)
	ctx := context.Background()

	if _, err := p.List(ctx, stocks.ListParams{Country: stocks.CountryNG}); err != nil {
		t.Fatal(err)
	}
	q, err := p.Quote(ctx, stocks.CountryNG, "dangcem") // case-insensitive
	if err != nil || q.Price != 700 || q.Currency != "NGN" || q.Country != stocks.CountryNG {
		t.Fatalf("quote = %+v, %v", q, err)
	}
	qs, err := p.Quotes(ctx, stocks.CountryNG, []string{"GTCO", "MTNN", "NOPE"})
	if err != nil || len(qs) != 2 || qs["GTCO"].Price != 55.4 {
		t.Fatalf("quotes = %+v, %v", qs, err)
	}
	if got := f.ngxCalls.Load(); got != 1 {
		t.Errorf("API calls = %d, want 1 (everything served from one cached call)", got)
	}
	if _, err := p.Quote(ctx, stocks.CountryNG, "NOPE"); !errors.Is(err, stocks.ErrNotFound) {
		t.Errorf("unknown symbol: want ErrNotFound, got %v", err)
	}
}

func TestNG_SearchAndPaging(t *testing.T) {
	_, p := newFake(t)
	ctx := context.Background()

	page, err := p.List(ctx, stocks.ListParams{Country: stocks.CountryNG, Search: "trust"})
	if err != nil || page.Total != 1 || page.Items[0].Symbol != "GTCO" {
		t.Fatalf("search by name: %+v, %v", page, err)
	}
	page, _ = p.List(ctx, stocks.ListParams{Country: stocks.CountryNG, Search: "MTN"})
	if page.Total != 1 || page.Items[0].Symbol != "MTNN" {
		t.Fatalf("search by symbol: %+v", page)
	}
	page, _ = p.List(ctx, stocks.ListParams{Country: stocks.CountryNG, Page: 2, Limit: 2})
	if len(page.Items) != 1 || page.HasNext || page.Total != 3 || page.Page != 2 {
		t.Fatalf("paging: %+v", page)
	}
}

func TestNG_ServesStaleDataWhenAPIFails(t *testing.T) {
	f, p := newFake(t)
	ctx := context.Background()
	if _, err := p.List(ctx, stocks.ListParams{Country: stocks.CountryNG}); err != nil {
		t.Fatal(err)
	}

	// Expire the cache, then break the API: the UI must keep working.
	p.now = func() time.Time { return time.Now().Add(time.Hour) }
	f.failAll.Store(true)
	q, err := p.Quote(ctx, stocks.CountryNG, "GTCO")
	if err != nil || q.Price != 55.4 {
		t.Fatalf("want stale quote, got %+v, %v", q, err)
	}

	// Beyond the stale window the error surfaces, mapped to a sentinel.
	p.now = func() time.Time { return time.Now().Add(48 * time.Hour) }
	if _, err := p.Quote(ctx, stocks.CountryNG, "GTCO"); !errors.Is(err, stocks.ErrRateLimited) {
		t.Fatalf("want ErrRateLimited, got %v", err)
	}
}

func TestUS_QuoteIsCaseSensitiveAndCached(t *testing.T) {
	f, p := newFake(t)
	ctx := context.Background()

	for i := 0; i < 3; i++ {
		q, err := p.Quote(ctx, stocks.CountryUS, "MSFT")
		if err != nil || q.Price != 529.76 || q.Currency != "USD" || !q.IsDelayed || q.QuoteTime == nil {
			t.Fatalf("quote = %+v, %v", q, err)
		}
	}
	if f.usCalls.Load() != 1 {
		t.Errorf("API calls = %d, want 1 (cached)", f.usCalls.Load())
	}
	if _, err := p.Quote(ctx, stocks.CountryUS, "msft"); !errors.Is(err, stocks.ErrNotFound) {
		t.Errorf("lowercase US symbol must not match, got %v", err)
	}
}

func TestPriceOn_TodayUsesQuoteNotHistory(t *testing.T) {
	f, p := newFake(t)
	f.chartStatus = 403
	f.chartBody = `{"success":false,"error":{"code":"PLAN_REQUIRED","message":"hobby"}}`

	price, used, err := p.PriceOn(context.Background(), stocks.CountryNG, "GTCO", time.Now())
	if err != nil || price != 55.4 {
		t.Fatalf("price=%v err=%v", price, err)
	}
	if used.Format("2006-01-02") != time.Now().UTC().Format("2006-01-02") {
		t.Errorf("dateUsed = %v", used)
	}
	if f.chartCalls.Load() != 0 {
		t.Error("a same-day purchase must not call the (paid) history endpoint")
	}
}

func TestPriceOn_HistoryDisabledSpendsNoAPICall(t *testing.T) {
	f, p := newFakeHistory(t, false) // the default: free plan, no history
	f.chartBody = `{"success":true,"data":{"data":[{"date":"2026-07-10","close":11.25}]}}`

	_, _, err := p.PriceOn(context.Background(), stocks.CountryUS, "MSFT", time.Date(2026, 7, 12, 0, 0, 0, 0, time.UTC))
	if !errors.Is(err, stocks.ErrHistoryUnavailable) {
		t.Fatalf("want ErrHistoryUnavailable, got %v", err)
	}
	if f.chartCalls.Load() != 0 || f.usCalls.Load() != 0 {
		t.Error("with history disabled no API call should be made")
	}

	// A same-day purchase still works: it only needs the live quote.
	if _, _, err := p.PriceOn(context.Background(), stocks.CountryNG, "GTCO", time.Now()); err != nil {
		t.Errorf("same-day price should still work, got %v", err)
	}
}

func TestPriceOn_HistoryNeedsPaidPlan(t *testing.T) {
	f, p := newFake(t)
	f.chartStatus = 403
	f.chartBody = `{"success":false,"error":{"code":"PLAN_REQUIRED","message":"hobby","required_plan":"hobby","current_plan":"free"}}`

	_, _, err := p.PriceOn(context.Background(), stocks.CountryNG, "GTCO", time.Now().AddDate(0, -3, 0))
	if !errors.Is(err, stocks.ErrHistoryUnavailable) {
		t.Fatalf("want ErrHistoryUnavailable, got %v", err)
	}
}

func TestPriceOn_ReturnsNearestEarlierTradingDay(t *testing.T) {
	f, p := newFake(t)
	f.chartBody = `{"success":true,"data":{"data":[{"date":"2026-07-09","close":10.5},{"date":"2026-07-10","close":11.25}]}}`

	price, used, err := p.PriceOn(context.Background(), stocks.CountryUS, "MSFT", time.Date(2026, 7, 12, 0, 0, 0, 0, time.UTC))
	if err != nil || price != 11.25 || used.Format("2006-01-02") != "2026-07-10" {
		t.Fatalf("price=%v used=%v err=%v", price, used, err)
	}
}

func TestQuotes_StopsOnRateLimitButKeepsEarlierResults(t *testing.T) {
	f, p := newFake(t)
	ctx := context.Background()
	if _, err := p.Quote(ctx, stocks.CountryUS, "MSFT"); err != nil { // warm the cache
		t.Fatal(err)
	}
	f.failAll.Store(true)

	// MSFT is served from cache; the second symbol needs the API, which is limiting us.
	got, err := p.Quotes(ctx, stocks.CountryUS, []string{"MSFT", "AAPL"})
	if !errors.Is(err, stocks.ErrRateLimited) {
		t.Fatalf("want ErrRateLimited, got %v", err)
	}
	if _, ok := got["MSFT"]; !ok {
		t.Errorf("partial results lost: %+v", got)
	}
}

func TestList_UnsupportedCountry(t *testing.T) {
	_, p := newFake(t)
	if _, err := p.List(context.Background(), stocks.ListParams{Country: "ZZ"}); !errors.Is(err, stocks.ErrUnavailable) {
		t.Fatalf("want ErrUnavailable, got %v", err)
	}
}
