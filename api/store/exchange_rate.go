package store

import (
	"context"
	"strings"
	"time"

	"gorm.io/gorm/clause"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source exchange_rate.go -destination ./mock/mock_exchange_rate.go -package mock ExchangeRateDatabase

// anchorCurrency is the base currency every cached rate is quoted against.
// exchangerate-api.com's free-tier endpoint is USD-anchored, so every row in
// exchange_rates has base_currency = anchorCurrency; a rate between any two
// other currencies is derived from this shared anchor at read time.
const anchorCurrency = "USD"

// ExchangeRateDatabase defines all persistence operations for cached FX rates.
type ExchangeRateDatabase interface {
	// UpsertRates replaces the cached rate for each currency against baseCurrency.
	// Existing rows for the same (base_currency, currency) pair are overwritten —
	// this table holds only the latest snapshot, not a history.
	UpsertRates(ctx context.Context, baseCurrency string, rates map[string]float64, fetchedAt time.Time) error
	// GetRate returns the conversion rate from one currency to another, derived
	// from the cached anchor-currency rates. Returns ErrRecordNotFound if either
	// currency has no cached rate yet.
	GetRate(ctx context.Context, from, to string) (float64, error)
	// ListRates returns every cached rate against the anchor currency, for
	// display (e.g. a settings page).
	ListRates(ctx context.Context) ([]model.ExchangeRate, error)
}

type exchangeRateStore struct{ storage *Store }

// NewExchangeRateStore returns an ExchangeRateDatabase backed by the given Store.
func NewExchangeRateStore(s *Store) ExchangeRateDatabase {
	return &exchangeRateStore{storage: s}
}

// UpsertRates writes one row per currency, updating rate/fetched_at/updated_at
// in place when a row for that (base_currency, currency) pair already exists.
func (e *exchangeRateStore) UpsertRates(ctx context.Context, baseCurrency string, rates map[string]float64, fetchedAt time.Time) error {
	baseCurrency = strings.ToUpper(baseCurrency)

	rows := make([]model.ExchangeRate, 0, len(rates))
	for currencyCode, rate := range rates {
		rows = append(rows, model.ExchangeRate{
			BaseCurrency: baseCurrency,
			Currency:     strings.ToUpper(currencyCode),
			Rate:         rate,
			FetchedAt:    fetchedAt,
			UpdatedAt:    time.Now().UTC(),
		})
	}
	if len(rows) == 0 {
		return nil
	}

	err := e.storage.DB.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "base_currency"}, {Name: "currency"}},
		DoUpdates: clause.AssignmentColumns([]string{"rate", "fetched_at", "updated_at"}),
	}).CreateInBatches(rows, 100).Error
	if err != nil {
		return siloErrors.ErrGenericErr
	}
	return nil
}

// GetRate returns the conversion rate from `from` to `to`, computed as
// toRate/fromRate against the shared anchor currency (both rates are
// "1 anchor = X currency", so dividing cancels the anchor out).
func (e *exchangeRateStore) GetRate(ctx context.Context, from, to string) (float64, error) {
	from, to = strings.ToUpper(from), strings.ToUpper(to)
	if from == to {
		return 1.0, nil
	}

	needed := make([]string, 0, 2)
	if from != anchorCurrency {
		needed = append(needed, from)
	}
	if to != anchorCurrency {
		needed = append(needed, to)
	}

	rateByCode := map[string]float64{anchorCurrency: 1.0}
	if len(needed) > 0 {
		var rows []model.ExchangeRate
		err := e.storage.DB.WithContext(ctx).
			Where("base_currency = ? AND currency IN ?", anchorCurrency, needed).
			Find(&rows).Error
		if err != nil {
			return 0, siloErrors.ErrGenericErr
		}
		for _, r := range rows {
			rateByCode[r.Currency] = r.Rate
		}
	}

	fromRate, ok := rateByCode[from]
	if !ok {
		return 0, siloErrors.ErrRecordNotFound
	}
	toRate, ok := rateByCode[to]
	if !ok {
		return 0, siloErrors.ErrRecordNotFound
	}
	return toRate / fromRate, nil
}

// ListRates returns every cached rate against the anchor currency.
func (e *exchangeRateStore) ListRates(ctx context.Context) ([]model.ExchangeRate, error) {
	var rows []model.ExchangeRate
	err := e.storage.DB.WithContext(ctx).
		Where("base_currency = ?", anchorCurrency).
		Order("currency ASC").
		Find(&rows).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return rows, nil
}
