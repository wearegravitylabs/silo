// Package exchangerate fetches daily FX rates from exchangerate-api.com's v6
// "latest" endpoint. Free tier: no signup required for open access, or get a
// key at https://www.exchangerate-api.com/ for higher limits and reliability.
package exchangerate

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const defaultBaseURL = "https://v6.exchangerate-api.com/v6"

// Provider fetches the latest FX rates for a base currency.
type Provider interface {
	// GetLatestRates returns every currency's rate against base (e.g. base="USD"
	// gives "1 USD = X <currency>" for every supported currency), plus the
	// timestamp the provider says the snapshot was taken.
	GetLatestRates(ctx context.Context, base string) (rates map[string]float64, fetchedAt time.Time, err error)
}

// Client talks to the exchangerate-api.com v6 API.
type Client struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// New returns an exchangerate-api.com client. apiKey is required — v6 embeds
// it directly in the URL path, not a header.
func New(apiKey, baseURL string) Provider {
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	return &Client{
		apiKey:     apiKey,
		baseURL:    strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{Timeout: 15 * time.Second},
	}
}

// latestResponse mirrors the subset of the v6 /latest/{base} payload we use.
// See https://www.exchangerate-api.com/docs/standard-requests for the full shape.
type latestResponse struct {
	Result             string             `json:"result"`
	ErrorType          string             `json:"error-type"`
	BaseCode           string             `json:"base_code"`
	TimeLastUpdateUnix int64              `json:"time_last_update_unix"`
	ConversionRates    map[string]float64 `json:"conversion_rates"`
}

// GetLatestRates fetches the full rate table for base (e.g. "USD").
func (c *Client) GetLatestRates(ctx context.Context, base string) (map[string]float64, time.Time, error) {
	if c.apiKey == "" {
		return nil, time.Time{}, fmt.Errorf("exchangerate: EXCHANGERATE_API_KEY is not configured")
	}

	rawURL := c.baseURL + "/" + url.PathEscape(c.apiKey) + "/latest/" + url.PathEscape(strings.ToUpper(base))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, time.Time{}, fmt.Errorf("exchangerate: GetLatestRates: %w", err)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, time.Time{}, fmt.Errorf("exchangerate: GetLatestRates: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, time.Time{}, fmt.Errorf("exchangerate: GetLatestRates: read body: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, time.Time{}, fmt.Errorf("exchangerate: HTTP %d for /latest/%s", resp.StatusCode, base)
	}

	var out latestResponse
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, time.Time{}, fmt.Errorf("exchangerate: GetLatestRates decode: %w", err)
	}
	if out.Result != "success" {
		return nil, time.Time{}, fmt.Errorf("exchangerate: API returned error-type %q", out.ErrorType)
	}

	return out.ConversionRates, time.Unix(out.TimeLastUpdateUnix, 0).UTC(), nil
}
