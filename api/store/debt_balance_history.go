package store

import (
	"context"
	"time"

	"github.com/google/uuid"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

// DebtBalanceHistoryDatabase persists debt balance history.
type DebtBalanceHistoryDatabase interface {
	Create(ctx context.Context, entry model.DebtBalanceHistory) (model.DebtBalanceHistory, error)
	// ListByDebts returns entries for the given debts recorded in [from, to],
	// oldest first.
	ListByDebts(ctx context.Context, debtIDs []uuid.UUID, from, to time.Time) ([]model.DebtBalanceHistory, error)
	// LatestBefore returns, per debt, the newest entry recorded at or before
	// the given time. Debts with no such entry are absent from the map.
	LatestBefore(ctx context.Context, debtIDs []uuid.UUID, at time.Time) (map[uuid.UUID]model.DebtBalanceHistory, error)
}

type debtBalanceHistStore struct{ storage *Store }

// NewDebtBalanceHistoryStore returns a DebtBalanceHistoryDatabase backed by the given Store.
func NewDebtBalanceHistoryStore(s *Store) DebtBalanceHistoryDatabase {
	return &debtBalanceHistStore{storage: s}
}

func (d *debtBalanceHistStore) Create(ctx context.Context, entry model.DebtBalanceHistory) (model.DebtBalanceHistory, error) {
	if err := d.storage.DB.WithContext(ctx).Create(&entry).Error; err != nil {
		return model.DebtBalanceHistory{}, siloErrors.ErrGenericErr
	}
	return entry, nil
}

func (d *debtBalanceHistStore) ListByDebts(ctx context.Context, debtIDs []uuid.UUID, from, to time.Time) ([]model.DebtBalanceHistory, error) {
	var entries []model.DebtBalanceHistory
	if len(debtIDs) == 0 {
		return entries, nil
	}
	err := d.storage.DB.WithContext(ctx).
		Where("debt_id IN ? AND recorded_at BETWEEN ? AND ?", debtIDs, from, to).
		Order("recorded_at ASC").
		Find(&entries).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return entries, nil
}

func (d *debtBalanceHistStore) LatestBefore(ctx context.Context, debtIDs []uuid.UUID, at time.Time) (map[uuid.UUID]model.DebtBalanceHistory, error) {
	out := map[uuid.UUID]model.DebtBalanceHistory{}
	if len(debtIDs) == 0 {
		return out, nil
	}
	var entries []model.DebtBalanceHistory
	err := d.storage.DB.WithContext(ctx).
		Raw(`SELECT DISTINCT ON (debt_id) * FROM debt_balance_history
		     WHERE debt_id IN ? AND recorded_at <= ?
		     ORDER BY debt_id, recorded_at DESC`, debtIDs, at).
		Scan(&entries).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	for _, e := range entries {
		out[e.DebtID] = e
	}
	return out, nil
}
