// Package debt implements liability tracking and amortization.
package debt

import (
	"context"
	"math"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/app/fx"
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
	// ExportRows returns all debts as spreadsheet rows, header first.
	ExportRows(ctx context.Context, portfolioID uuid.UUID) ([][]string, error)
	// Overview adds up a portfolio's debts in its base currency.
	Overview(ctx context.Context, portfolioID uuid.UUID) (model.DebtSummary, error)
	// ListBalanceHistory returns a debt's balances in [from, to], oldest first,
	// with the owned share in base currency and the change from the entry before.
	ListBalanceHistory(ctx context.Context, debtID uuid.UUID, from, to time.Time) ([]model.DebtBalanceHistory, error)
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
		if err := s.checkFolder(ctx, *req.FolderID, portfolioID); err != nil {
			return model.Debt{}, err
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
		portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, portfolioID)
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
		Icon:          req.Icon,
		Metadata:      req.Metadata,
		CreatedAt:     time.Now().UTC(),
		UpdatedAt:     time.Now().UTC(),
	}

	created, err := s.dp.DebtStore.CreateDebt(ctx, debt)
	if err != nil {
		log.Error().Err(err).Msg("failed to create debt")
		return model.Debt{}, err
	}

	// Starting history: the principal on the start date (when it is in the
	// past), then today's balance.
	if req.StartDate != nil && model.StartOfDay(*req.StartDate).Before(model.StartOfDay(time.Now())) {
		s.recordBalance(ctx, created, created.Principal, model.StartOfDay(*req.StartDate), model.DebtBalanceSourceCreate, "")
	}
	s.recordBalance(ctx, created, created.Balance, time.Now().UTC(), model.DebtBalanceSourceManual, "")

	log.Info().Str("debt_id", created.ID.String()).Msg("debt created")
	return s.present(ctx, created)
}

// GetByID returns a single debt by ID.
func (s *service) GetByID(ctx context.Context, id uuid.UUID) (model.Debt, error) {
	debt, err := s.dp.DebtStore.GetDebtByID(ctx, id)
	if err != nil {
		return model.Debt{}, err
	}
	return s.present(ctx, debt)
}

// present returns one debt with its computed fields filled in.
func (s *service) present(ctx context.Context, d model.Debt) (model.Debt, error) {
	portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, d.PortfolioID)
	if err != nil {
		return model.Debt{}, err
	}
	list := []model.Debt{d}
	if err := Enrich(ctx, s.dp, list, fx.New(s.dp, portfolio.BaseCurrency)); err != nil {
		return model.Debt{}, err
	}
	return list[0], nil
}

// ListByPortfolio returns all debts for a portfolio with optional filters.
func (s *service) ListByPortfolio(ctx context.Context, portfolioID uuid.UUID, filter model.ListDebtsFilter) ([]model.Debt, error) {
	portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, portfolioID)
	if err != nil {
		return nil, err
	}
	debts, err := s.dp.DebtStore.ListDebtsByPortfolio(ctx, portfolioID, filter)
	if err != nil {
		return nil, err
	}
	if err := Enrich(ctx, s.dp, debts, fx.New(s.dp, portfolio.BaseCurrency)); err != nil {
		return nil, err
	}
	return debts, nil
}

// Overview adds up all of a portfolio's debts.
func (s *service) Overview(ctx context.Context, portfolioID uuid.UUID) (model.DebtSummary, error) {
	portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, portfolioID)
	if err != nil {
		return model.DebtSummary{}, err
	}
	debts, err := s.dp.DebtStore.ListDebtsByPortfolio(ctx, portfolioID, model.ListDebtsFilter{})
	if err != nil {
		return model.DebtSummary{}, err
	}
	conv := fx.New(s.dp, portfolio.BaseCurrency)
	if err := Enrich(ctx, s.dp, debts, conv); err != nil {
		return model.DebtSummary{}, err
	}
	return Summarize(ctx, s.dp, debts, conv)
}

// ListBalanceHistory returns a debt's balance history with base-currency values.
func (s *service) ListBalanceHistory(ctx context.Context, debtID uuid.UUID, from, to time.Time) ([]model.DebtBalanceHistory, error) {
	d, err := s.dp.DebtStore.GetDebtByID(ctx, debtID)
	if err != nil {
		return nil, err
	}
	portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, d.PortfolioID)
	if err != nil {
		return nil, err
	}
	ids := []uuid.UUID{debtID}
	entries, err := s.dp.DebtBalanceHistStore.ListByDebts(ctx, ids, from, to)
	if err != nil {
		return nil, err
	}

	conv := fx.New(s.dp, portfolio.BaseCurrency)
	owned := func(e model.DebtBalanceHistory) float64 {
		return round2(conv.Convert(ctx, e.Balance, e.Currency) * d.OwnershipPct / 100)
	}
	// The entry just before the range, so the first point in it has a change too.
	prev, hasPrev := 0.0, false
	if before, err := s.dp.DebtBalanceHistStore.LatestBefore(ctx, ids, from.Add(-time.Nanosecond)); err == nil {
		if e, ok := before[debtID]; ok {
			prev, hasPrev = owned(e), true
		}
	}
	for i := range entries {
		e := &entries[i]
		e.OwnedBalanceConverted = owned(*e)
		e.ConvertedCurrency = conv.To()
		if hasPrev {
			change := round2(e.OwnedBalanceConverted - prev)
			e.ChangeAmount = &change
			e.ChangePct = fx.ChangePct(prev, e.OwnedBalanceConverted)
		}
		prev, hasPrev = e.OwnedBalanceConverted, true
	}
	return entries, nil
}

// recordBalance writes a balance history entry. A failure is logged, not
// returned: the debt itself is already saved.
func (s *service) recordBalance(ctx context.Context, d model.Debt, balance float64, at time.Time, source, note string) {
	_, err := s.dp.DebtBalanceHistStore.Create(ctx, model.DebtBalanceHistory{
		DebtID: d.ID, Balance: balance, Currency: d.Currency, Source: source, Note: note, RecordedAt: at,
	})
	if err != nil {
		log := siloLogger.FromCtx(ctx)
		log.Error().Err(err).Str("debt_id", d.ID.String()).Msg("failed to record balance history")
	}
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
	if req.FolderID.Set {
		if req.FolderID.Value != nil {
			if err := s.checkFolder(ctx, *req.FolderID.Value, debt.PortfolioID); err != nil {
				return model.Debt{}, err
			}
		}
		debt.FolderID = req.FolderID.Value
	}
	if req.Name != nil {
		debt.Name = *req.Name
	}
	if req.OwnershipPct != nil {
		debt.OwnershipPct = *req.OwnershipPct
	}

	// A new balance comes either as the whole debt's balance (balance) or as
	// the owned share in the base currency (owned_balance), never both.
	newBalance, err := s.balanceFromRequest(ctx, debt, req)
	if err != nil {
		return model.Debt{}, err
	}
	balanceAt, ok := model.RecordTime(req.BalanceDate)
	if !ok {
		return model.Debt{}, siloErrors.ErrDateInFuture
	}
	if req.BalanceDate != nil && newBalance == nil {
		return model.Debt{}, siloErrors.ErrInvalidRequest
	}
	// A back-dated balance only fills in history; balance follows the newest.
	balanceChanged := false
	if newBalance != nil && s.isNewest(ctx, debt.ID, balanceAt) {
		balanceChanged = *newBalance != debt.Balance
		debt.Balance = *newBalance
	}
	if req.Icon.Set {
		debt.Icon = req.Icon.Value
	}
	if req.Metadata != nil {
		debt.Metadata = req.Metadata
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
	if req.StartDate != nil {
		debt.StartDate = req.StartDate
	}

	debt.UpdatedAt = time.Now().UTC()

	updated, err := s.dp.DebtStore.UpdateDebt(ctx, debt)
	if err != nil {
		log.Error().Err(err).Msg("failed to update debt")
		return model.Debt{}, err
	}

	if newBalance != nil && (req.BalanceDate != nil || balanceChanged || req.BalanceNote != "") {
		s.recordBalance(ctx, updated, *newBalance, balanceAt, model.DebtBalanceSourceManual, req.BalanceNote)
	}

	log.Info().Msg("debt updated")
	return s.present(ctx, updated)
}

// balanceFromRequest returns the new whole-debt balance an update asks for, or nil.
func (s *service) balanceFromRequest(ctx context.Context, d model.Debt, req model.UpdateDebtRequest) (*float64, error) {
	switch {
	case req.Balance != nil && req.OwnedBalance != nil:
		return nil, siloErrors.ErrInvalidRequest
	case req.Balance != nil:
		if *req.Balance < 0 {
			return nil, siloErrors.ErrInvalidRequest
		}
		return req.Balance, nil
	case req.OwnedBalance != nil:
		if d.OwnershipPct <= 0 || *req.OwnedBalance < 0 {
			return nil, siloErrors.ErrInvalidRequest
		}
		portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, d.PortfolioID)
		if err != nil {
			return nil, err
		}
		rate := fx.New(s.dp, portfolio.BaseCurrency).Rate(ctx, d.Currency)
		balance := *req.OwnedBalance / rate / (d.OwnershipPct / 100)
		return &balance, nil
	}
	return nil, nil
}

// isNewest reports whether a balance dated at is at least as new as the
// debt's latest history entry (so it should become the current balance).
func (s *service) isNewest(ctx context.Context, debtID uuid.UUID, at time.Time) bool {
	latest, err := s.dp.DebtBalanceHistStore.LatestBefore(ctx, []uuid.UUID{debtID}, time.Now().UTC().Add(time.Hour))
	if err != nil {
		return true
	}
	e, ok := latest[debtID]
	return !ok || !at.Before(model.StartOfDay(e.RecordedAt))
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
	if debt.PaymentAmount <= 0 || debt.InterestRate < 0 {
		return nil, siloErrors.ErrInvalidRequest
	}

	periodRate := debt.InterestRate / 100 / float64(periodsPerYear(debt.Frequency))

	// The schedule runs from today, because balance is today's balance. (It
	// used to start at start_date, putting today's balance on old dates.)
	startDate := model.StartOfDay(time.Now())

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

		paymentDate := paymentDate(startDate, debt.Frequency, i)
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
	case model.FrequencyBiannual:
		return 2
	case model.FrequencyAnnually:
		return 1
	default:
		return 12 // default to monthly
	}
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

// checkFolder makes sure a debt is being put in a debt folder of its own
// portfolio.
func (s *service) checkFolder(ctx context.Context, folderID, portfolioID uuid.UUID) error {
	folder, err := s.dp.FolderStore.GetFolderByID(ctx, folderID)
	if err != nil || folder.PortfolioID != portfolioID {
		return siloErrors.ErrFolderNotFound
	}
	if folder.FolderType != model.FolderTypeDebt {
		return siloErrors.ErrFolderTypeMismatch
	}
	return nil
}
