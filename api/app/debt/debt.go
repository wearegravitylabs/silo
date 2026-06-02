// Package debt implements liability tracking and amortization.
package debt

import (
	"context"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source debt.go -destination ../mock/debt/mock_debt.go -package debt Debt

// Debt defines liability management operations.
type Debt interface {
	Create(ctx context.Context, portfolioID uuid.UUID, req model.CreateDebtRequest) (model.Debt, error)
	GetByID(ctx context.Context, id uuid.UUID) (model.Debt, error)
	ListByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.Debt, error)
	Update(ctx context.Context, id uuid.UUID, req model.UpdateDebtRequest) (model.Debt, error)
	Delete(ctx context.Context, id uuid.UUID) error
	// AmortizationSchedule calculates the payment schedule for a scheduled debt.
	AmortizationSchedule(ctx context.Context, debtID uuid.UUID) ([]AmortizationEntry, error)
}

// AmortizationEntry represents a single payment in an amortization schedule.
type AmortizationEntry struct {
	PaymentNumber    int
	PaymentDate      string
	Payment          float64
	Principal        float64
	Interest         float64
	RemainingBalance float64
}

type service struct{ dp app.Dependency }

// New returns a Debt service.
func New(dp app.Dependency) Debt { return &service{dp: dp} }

func (s *service) Create(ctx context.Context, portfolioID uuid.UUID, req model.CreateDebtRequest) (model.Debt, error) {
	panic("not implemented")
}

func (s *service) GetByID(ctx context.Context, id uuid.UUID) (model.Debt, error) {
	return s.dp.DebtStore.GetDebtByID(ctx, id)
}

func (s *service) ListByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.Debt, error) {
	return s.dp.DebtStore.ListDebtsByPortfolio(ctx, portfolioID)
}

func (s *service) Update(ctx context.Context, id uuid.UUID, req model.UpdateDebtRequest) (model.Debt, error) {
	panic("not implemented")
}

func (s *service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.dp.DebtStore.SoftDeleteDebt(ctx, id)
}

func (s *service) AmortizationSchedule(ctx context.Context, debtID uuid.UUID) ([]AmortizationEntry, error) {
	// TODO: implement standard amortization formula
	// P = L[c(1+c)^n] / [(1+c)^n - 1]
	panic("not implemented")
}
