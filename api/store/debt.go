package store

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source debt.go -destination ./mock/mock_debt.go -package mock DebtDatabase

// DebtDatabase defines all persistence operations for debts.
type DebtDatabase interface {
	CreateDebt(ctx context.Context, debt model.Debt) (model.Debt, error)
	GetDebtByID(ctx context.Context, id uuid.UUID) (model.Debt, error)
	ListDebtsByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.Debt, error)
	UpdateDebt(ctx context.Context, debt model.Debt) (model.Debt, error)
	SoftDeleteDebt(ctx context.Context, id uuid.UUID) error
}

type debtStore struct{ storage *Store }

// NewDebtStore returns a DebtDatabase backed by the given Store.
func NewDebtStore(s *Store) DebtDatabase { return &debtStore{storage: s} }

func (d *debtStore) CreateDebt(ctx context.Context, debt model.Debt) (model.Debt, error) {
	if err := d.storage.DB.WithContext(ctx).Create(&debt).Error; err != nil {
		return model.Debt{}, siloErrors.ErrGenericErr
	}
	return debt, nil
}

func (d *debtStore) GetDebtByID(ctx context.Context, id uuid.UUID) (model.Debt, error) {
	var debt model.Debt
	err := d.storage.DB.WithContext(ctx).Where("id = ? AND deleted_at IS NULL", id).First(&debt).Error
	if err == gorm.ErrRecordNotFound {
		return model.Debt{}, siloErrors.ErrDebtNotFound
	}
	if err != nil {
		return model.Debt{}, siloErrors.ErrGenericErr
	}
	return debt, nil
}

func (d *debtStore) ListDebtsByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.Debt, error) {
	var debts []model.Debt
	if err := d.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND deleted_at IS NULL", portfolioID).
		Order("created_at ASC").
		Find(&debts).Error; err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return debts, nil
}

func (d *debtStore) UpdateDebt(ctx context.Context, debt model.Debt) (model.Debt, error) {
	if err := d.storage.DB.WithContext(ctx).Save(&debt).Error; err != nil {
		return model.Debt{}, siloErrors.ErrGenericErr
	}
	return debt, nil
}

func (d *debtStore) SoftDeleteDebt(ctx context.Context, id uuid.UUID) error {
	return d.storage.DB.WithContext(ctx).
		Model(&model.Debt{}).
		Where("id = ?", id).
		Update("deleted_at", gorm.Expr("NOW()")).Error
}
