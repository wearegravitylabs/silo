package debt

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/app/fx"
	"github.com/wearegravitylabs/silo/api/model"
)

// Enrich fills the computed fields on debts in place: owned balance, its
// base-currency value, the monthly payment and the 1-month change. History
// is loaded in one query for the whole list. The dashboard uses it too.
func Enrich(ctx context.Context, dp app.Dependency, debts []model.Debt, conv *fx.Converter) error {
	ids := make([]uuid.UUID, len(debts))
	for i := range debts {
		ids[i] = debts[i].ID
	}
	cutoff := time.Now().UTC().AddDate(0, 0, -30)
	monthAgo, err := dp.DebtBalanceHistStore.LatestBefore(ctx, ids, cutoff)
	if err != nil {
		return err
	}
	for i := range debts {
		d := &debts[i]
		enrichDebt(d)
		rate := conv.Rate(ctx, d.Currency)
		d.OwnedBalanceConverted = round2(d.OwnedBalance * rate)
		d.ConvertedCurrency = conv.To()
		d.ExchangeRate = rate
		if d.HasSchedule {
			d.MonthlyPayment = round2(monthly(d.PaymentAmount, d.Frequency) * d.OwnershipPct / 100 * rate)
		}
		// Only for debts already in Silo 30 days ago (see asset enrichAll).
		if old, ok := monthAgo[d.ID]; ok && d.CreatedAt.Before(cutoff) {
			then := round2(old.Balance * d.OwnershipPct / 100 * rate)
			change := round2(d.OwnedBalanceConverted - then)
			d.ChangeAmount1M = &change
			d.ChangePct1M = fx.ChangePct(then, d.OwnedBalanceConverted)
		}
	}
	return nil
}

// Summarize adds up enriched debts (see Enrich) into the debts overview.
func Summarize(ctx context.Context, dp app.Dependency, debts []model.Debt, conv *fx.Converter) (model.DebtSummary, error) {
	sum := model.DebtSummary{Currency: conv.To(), Count: len(debts)}
	var monthAgo float64
	hasMonthAgo := false
	for _, d := range debts {
		sum.Total += d.OwnedBalanceConverted
		if d.HasSchedule {
			sum.ScheduledTotal += d.OwnedBalanceConverted
			sum.MonthlyPayments += d.MonthlyPayment
		} else {
			sum.UnscheduledTotal += d.OwnedBalanceConverted
		}
		if d.ChangeAmount1M != nil {
			monthAgo += d.OwnedBalanceConverted - *d.ChangeAmount1M
			hasMonthAgo = true
		} else {
			// No balance from 30 days ago (a new debt): count it as unchanged.
			monthAgo += d.OwnedBalanceConverted
		}
	}

	interest, err := interestPaidYTD(ctx, dp, debts, conv)
	if err != nil {
		return model.DebtSummary{}, err
	}
	sum.InterestPaidYTD = interest
	sum.DebtFreeDate = debtFreeDate(debts)

	sum.Total = round2(sum.Total)
	sum.ScheduledTotal = round2(sum.ScheduledTotal)
	sum.UnscheduledTotal = round2(sum.UnscheduledTotal)
	sum.MonthlyPayments = round2(sum.MonthlyPayments)
	if hasMonthAgo {
		change := round2(sum.Total - monthAgo)
		sum.ChangeAmount1M = &change
		sum.ChangePct1M = fx.ChangePct(monthAgo, sum.Total)
	}
	return sum, nil
}

// interestPaidYTD estimates the interest charged since 1 January on scheduled
// debts: for each month, the balance known at the start of that month times a
// twelfth of the yearly rate. Owned share, base currency.
func interestPaidYTD(ctx context.Context, dp app.Dependency, debts []model.Debt, conv *fx.Converter) (float64, error) {
	now := time.Now().UTC()
	jan1 := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, time.UTC)
	var ids []uuid.UUID
	for _, d := range debts {
		if d.HasSchedule && d.InterestRate > 0 {
			ids = append(ids, d.ID)
		}
	}
	if len(ids) == 0 {
		return 0, nil
	}

	var total float64
	for m := jan1; m.Before(now); m = m.AddDate(0, 1, 0) {
		known, err := dp.DebtBalanceHistStore.LatestBefore(ctx, ids, m)
		if err != nil {
			return 0, err
		}
		// Part of the current month counts for the days gone so far.
		share := 1.0
		if next := m.AddDate(0, 1, 0); next.After(now) {
			share = now.Sub(m).Hours() / next.Sub(m).Hours()
		}
		for _, d := range debts {
			if !d.HasSchedule || d.InterestRate <= 0 {
				continue
			}
			if d.StartDate != nil && d.StartDate.After(m) {
				continue
			}
			balance := d.Balance
			if e, ok := known[d.ID]; ok {
				balance = e.Balance
			}
			owned := balance * d.OwnershipPct / 100
			total += conv.Convert(ctx, owned*d.InterestRate/100/12*share, d.Currency)
		}
	}
	return round2(total), nil
}

// debtFreeDate is when the last scheduled debt is paid off at its current
// payment, starting from today's balance. Nil when there is no scheduled
// debt, or one never gets paid off.
func debtFreeDate(debts []model.Debt) *string {
	var last time.Time
	found := false
	for _, d := range debts {
		if !d.HasSchedule || d.Balance <= 0 {
			continue
		}
		end, ok := payoffDate(d.Balance, d.InterestRate, d.PaymentAmount, d.Frequency, time.Now().UTC())
		if !ok {
			return nil
		}
		if end.After(last) {
			last = end
		}
		found = true
	}
	if !found {
		return nil
	}
	s := last.Format("2006-01-02")
	return &s
}

// payoffDate runs the amortization from today until the balance reaches 0.
// ok is false when the payment doesn't cover the interest (or 50 years pass).
func payoffDate(balance, ratePct, payment float64, freq model.PaymentFrequency, from time.Time) (time.Time, bool) {
	if payment <= 0 {
		return time.Time{}, false
	}
	n := periodsPerYear(freq)
	rate := ratePct / 100 / float64(n)
	for i := 1; i <= 50*n; i++ {
		balance = balance*(1+rate) - payment
		if balance <= 0 {
			return paymentDate(from, freq, i), true
		}
	}
	return time.Time{}, false
}

// paymentDate is the date of the i-th payment after from.
func paymentDate(from time.Time, freq model.PaymentFrequency, i int) time.Time {
	switch freq {
	case model.FrequencyDaily:
		return from.AddDate(0, 0, i)
	case model.FrequencyWeekly:
		return from.AddDate(0, 0, 7*i)
	case model.FrequencyBiweekly:
		return from.AddDate(0, 0, 14*i)
	case model.FrequencyQuarterly:
		return from.AddDate(0, 3*i, 0)
	case model.FrequencyBiannual:
		return from.AddDate(0, 6*i, 0)
	case model.FrequencyAnnually:
		return from.AddDate(i, 0, 0)
	default:
		return from.AddDate(0, i, 0)
	}
}

// monthly turns a payment at the given frequency into a monthly amount.
func monthly(payment float64, freq model.PaymentFrequency) float64 {
	return payment * float64(periodsPerYear(freq)) / 12
}
