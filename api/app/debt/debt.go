// Package debt implements liability tracking and amortization.
package debt

import (
	"context"
	"math"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

//go:generate mockgen -source debt.go -destination ../mock/debt/mock_debt.go -package debt Debt

// Debt defines liability management operations.
type Debt interface {
	Create(ctx context.Context, portfolioID uuid.UUID, req model.CreateDebtRequest) (model.Debt, error)
	GetByID(ctx context.Context, id uuid.UUID) (model.Debt, error)
	ListByPortfolio(ctx context.Context, portfolioID uuid.UUID, filter model.ListDebtsFilter) ([]model.Debt, error)
	Update(ctx context.Context, id uuid.UUID, req model.UpdateDebtRequest) (model.Debt, error)
	Delete(ctx context.Context, id uuid.UUID) error
	// AmortizationSchedule calculates the payment schedule for a scheduled debt.
	AmortizationSchedule(ctx context.Context, debtID uuid.UUID) ([]AmortizationEntry, error)
}

// AmortizationEntry represents a single payment in an amortization schedule.
type AmortizationEntry struct {
	PaymentNumber    int     `json:"payment_number"`
	PaymentDate      string  `json:"payment_date"`
	Payment          float64 `json:"payment"`
	Principal        float64 `json:"principal"`
	Interest         float64 `json:"interest"`
	RemainingBalance float64 `json:"remaining_balance"`
}

type service struct{ dp app.Dependency }

// New returns a Debt service.
func New(dp app.Dependency) Debt { return &service{dp: dp} }

// Create validates and persists a new debt.
func (s *service) Create(ctx context.Context, portfolioID uuid.UUID, req model.CreateDebtRequest) (model.Debt, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "debt.Create").
		Str("portfolio_id", portfolioID.String()).
		Logger()

	if !validDebtType(req.DebtType) {
		return model.Debt{}, siloErrors.ErrInvalidDebtType
	}

	if req.FolderID != nil {
		folder, err := s.dp.FolderStore.GetFolderByID(ctx, *req.FolderID)
		if err != nil {
			return model.Debt{}, siloErrors.ErrFolderNotFound
		}
		if folder.PortfolioID != portfolioID {
			return model.Debt{}, siloErrors.ErrFolderNotFound
		}
		if folder.FolderType != model.FolderTypeDebt {
			return model.Debt{}, siloErrors.ErrFolderTypeMismatch
		}
	}

	// Default ownership to 100% if not provided.
	ownershipPct := req.OwnershipPct
	if ownershipPct == 0 {
		ownershipPct = 100
	}

	// Default currency to portfolio base currency if not provided.
	currency := req.Currency
	if currency == "" {
		portfolio, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, portfolioID, uuid.Nil)
		if err == nil {
			currency = portfolio.BaseCurrency
		} else {
			currency = "USD"
		}
	}

	debt := model.Debt{
		PortfolioID:   portfolioID,
		FolderID:      req.FolderID,
		Name:          req.Name,
		DebtType:      req.DebtType,
		Principal:     req.Principal,
		Balance:       req.Balance,
		InterestRate:  req.InterestRate,
		PaymentAmount: req.PaymentAmount,
		Frequency:     req.Frequency,
		HasSchedule:   req.HasSchedule,
		Currency:      currency,
		OwnershipPct:  ownershipPct,
		StartDate:     req.StartDate,
		CreatedAt:     time.Now().UTC(),
		UpdatedAt:     time.Now().UTC(),
	}

	created, err := s.dp.DebtStore.CreateDebt(ctx, debt)
	if err != nil {
		log.Error().Err(err).Msg("failed to create debt")
		return model.Debt{}, err
	}

	enrichDebt(&created)
	log.Info().Str("debt_id", created.ID.String()).Msg("debt created")
	return created, nil
}

// GetByID returns a single debt by ID.
func (s *service) GetByID(ctx context.Context, id uuid.UUID) (model.Debt, error) {
	debt, err := s.dp.DebtStore.GetDebtByID(ctx, id)
	if err != nil {
		return model.Debt{}, err
	}
	enrichDebt(&debt)
	return debt, nil
}

// ListByPortfolio returns all debts for a portfolio with optional filters.
func (s *service) ListByPortfolio(ctx context.Context, portfolioID uuid.UUID, filter model.ListDebtsFilter) ([]model.Debt, error) {
	debts, err := s.dp.DebtStore.ListDebtsByPortfolio(ctx, portfolioID, filter)
	if err != nil {
		return nil, err
	}
	for i := range debts {
		enrichDebt(&debts[i])
	}
	return debts, nil
}

// Update applies partial updates to an existing debt.
func (s *service) Update(ctx context.Context, id uuid.UUID, req model.UpdateDebtRequest) (model.Debt, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "debt.Update").
		Str("debt_id", id.String()).
		Logger()

	debt, err := s.dp.DebtStore.GetDebtByID(ctx, id)
	if err != nil {
		return model.Debt{}, err
	}

	// Apply only non-nil fields.
	if req.FolderID != nil {
		debt.FolderID = req.FolderID
	}
	if req.Name != nil {
		debt.Name = *req.Name
	}
	if req.Balance != nil {
		debt.Balance = *req.Balance
	}
	if req.InterestRate != nil {
		debt.InterestRate = *req.InterestRate
	}
	if req.PaymentAmount != nil {
		debt.PaymentAmount = *req.PaymentAmount
	}
	if req.Frequency != nil {
		debt.Frequency = *req.Frequency
	}
	if req.HasSchedule != nil {
		debt.HasSchedule = *req.HasSchedule
	}
	if req.OwnershipPct != nil {
		debt.OwnershipPct = *req.OwnershipPct
	}
	if req.StartDate != nil {
		debt.StartDate = req.StartDate
	}

	debt.UpdatedAt = time.Now().UTC()

	updated, err := s.dp.DebtStore.UpdateDebt(ctx, debt)
	if err != nil {
		log.Error().Err(err).Msg("failed to update debt")
		return model.Debt{}, err
	}

	enrichDebt(&updated)
	log.Info().Msg("debt updated")
	return updated, nil
}

// Delete soft-deletes a debt.
func (s *service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.dp.DebtStore.SoftDeleteDebt(ctx, id)
}

// AmortizationSchedule calculates the full payment schedule for a debt.
// The debt must have has_schedule=true, a payment_amount, and an interest_rate.
func (s *service) AmortizationSchedule(ctx context.Context, debtID uuid.UUID) ([]AmortizationEntry, error) {
	debt, err := s.dp.DebtStore.GetDebtByID(ctx, debtID)
	if err != nil {
		return nil, err
	}

	if !debt.HasSchedule {
		return nil, siloErrors.ErrInvalidRequest
	}
	if debt.PaymentAmount <= 0 || debt.InterestRate <= 0 {
		return nil, siloErrors.ErrInvalidRequest
	}

	periodsPerYear := periodsPerYear(debt.Frequency)
	if periodsPerYear == 0 {
		return nil, siloErrors.ErrInvalidRequest
	}

	periodRate := debt.InterestRate / 100 / float64(periodsPerYear)
	periodDuration := time.Duration(365*24*time.Hour) / time.Duration(periodsPerYear)

	startDate := time.Now().UTC()
	if debt.StartDate != nil {
		startDate = *debt.StartDate
	}

	balance := debt.Balance
	payment := debt.PaymentAmount
	const maxPeriods = 600 // 50-year safety cap

	entries := make([]AmortizationEntry, 0, 360)
	for i := 1; i <= maxPeriods && balance > 0; i++ {
		interest := round2(balance * periodRate)
		principal := round2(payment - interest)

		// Last payment: don't overpay.
		if principal > balance {
			principal = round2(balance)
			payment = round2(interest + principal)
		}

		balance = round2(balance - principal)
		if balance < 0 {
			balance = 0
		}

		paymentDate := startDate.Add(time.Duration(i) * periodDuration)
		entries = append(entries, AmortizationEntry{
			PaymentNumber:    i,
			PaymentDate:      paymentDate.Format("2006-01-02"),
			Payment:          payment,
			Principal:        principal,
			Interest:         interest,
			RemainingBalance: balance,
		})
	}

	return entries, nil
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// enrichDebt populates computed fields on a debt after a DB fetch.
func enrichDebt(d *model.Debt) {
	d.OwnedBalance = d.Balance * (d.OwnershipPct / 100.0)
}

func validDebtType(t model.DebtType) bool {
	switch t {
	case model.DebtTypeMortgage, model.DebtTypeStudentLoan, model.DebtTypeCarLoan,
		model.DebtTypePersonal, model.DebtTypeCreditCard, model.DebtTypeManual:
		return true
	}
	return false
}

func periodsPerYear(f model.PaymentFrequency) int {
	switch f {
	case model.FrequencyDaily:
		return 365
	case model.FrequencyWeekly:
		return 52
	case model.FrequencyBiweekly:
		return 26
	case model.FrequencyMonthly:
		return 12
	case model.FrequencyQuarterly:
		return 4
	case model.FrequencyAnnually:
		return 1
	default:
		return 12 // default to monthly
	}
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
