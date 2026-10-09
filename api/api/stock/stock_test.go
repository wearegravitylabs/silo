package stock

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/wearegravitylabs/silo/api/app"
	appStock "github.com/wearegravitylabs/silo/api/app/stock"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/thirdparty/stocks"
)

func init() { gin.SetMode(gin.TestMode) }

// fakeProvider is a stocks.Provider whose List result is scripted.
type fakeProvider struct {
	page stocks.Page
	err  error
	got  stocks.ListParams
}

func (f *fakeProvider) List(_ context.Context, p stocks.ListParams) (stocks.Page, error) {
	f.got = p
	return f.page, f.err
}
func (f *fakeProvider) Quote(context.Context, stocks.Country, string) (stocks.Stock, error) {
	return stocks.Stock{}, nil
}
func (f *fakeProvider) Quotes(context.Context, stocks.Country, []string) (map[string]stocks.Stock, error) {
	return nil, nil
}
func (f *fakeProvider) PriceOn(context.Context, stocks.Country, string, time.Time) (float64, time.Time, error) {
	return 0, time.Time{}, nil
}

func get(t *testing.T, p stocks.Provider, query string) (int, map[string]any) {
	t.Helper()
	r := gin.New()
	New(r.Group(""), appStock.New(app.Dependency{Stocks: p}))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/stocks"+query, nil))
	var body map[string]any
	_ = json.Unmarshal(w.Body.Bytes(), &body)
	return w.Code, body
}

func errCode(body map[string]any) string {
	e, _ := body["error"].(map[string]any)
	c, _ := e["code"].(string)
	return c
}

func TestList_Success(t *testing.T) {
	f := &fakeProvider{page: stocks.Page{
		Items: []stocks.Stock{{Symbol: "GTCO", Country: stocks.CountryNG, Currency: "NGN", Price: 55.4}},
		Page:  1, Limit: 50, Total: 1,
	}}
	code, body := get(t, f, "?country=ng&search=gt&page=2&limit=10") // country is case-insensitive
	if code != 200 {
		t.Fatalf("status = %d, body=%v", code, body)
	}
	if f.got.Country != stocks.CountryNG || f.got.Search != "gt" || f.got.Page != 2 || f.got.Limit != 10 {
		t.Errorf("params not passed through: %+v", f.got)
	}
	items := body["data"].(map[string]any)["items"].([]any)
	first := items[0].(map[string]any)
	if first["symbol"] != "GTCO" || first["currency"] != "NGN" {
		t.Errorf("unexpected item: %v", first)
	}
}

func TestList_ErrorCodesTheFrontendReactsTo(t *testing.T) {
	cases := []struct {
		name    string
		query   string
		provide stocks.Provider // nil interface => provider not configured
		status  int
		code    string
	}{
		{"missing country", "", &fakeProvider{}, 400, siloErrors.ErrInvalidCountry.Code},
		{"unsupported country", "?country=ZZ", &fakeProvider{}, 400, siloErrors.ErrInvalidCountry.Code},
		{"rate limited", "?country=NG", &fakeProvider{err: stocks.ErrRateLimited}, 429, siloErrors.ErrMarketRateLimited.Code},
		{"monthly quota spent", "?country=US", &fakeProvider{err: stocks.ErrQuotaExceeded}, 503, siloErrors.ErrMarketQuotaExceeded.Code},
		{"provider outage", "?country=US", &fakeProvider{err: stocks.ErrUnavailable}, 503, siloErrors.ErrMarketUnavailable.Code},
		{"unexpected error", "?country=NG", &fakeProvider{err: context.DeadlineExceeded}, 503, siloErrors.ErrMarketUnavailable.Code},
		{"no api key configured", "?country=NG", nil, 503, siloErrors.ErrMarketUnavailable.Code},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			code, body := get(t, tc.provide, tc.query)
			if code != tc.status || errCode(body) != tc.code {
				t.Errorf("got %d %q, want %d %q", code, errCode(body), tc.status, tc.code)
			}
		})
	}
}
