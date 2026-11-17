package debt

import (
	"testing"
	"time"

	"github.com/wearegravitylabs/silo/api/model"
)

func TestMonthly(t *testing.T) {
	cases := []struct {
		freq model.PaymentFrequency
		want float64
	}{
		{model.FrequencyMonthly, 1200},
		{model.FrequencyAnnually, 100},
		{model.FrequencyQuarterly, 400},
		{model.FrequencyBiannual, 200},
		{model.FrequencyWeekly, 5200},
	}
	for _, c := range cases {
		if got := monthly(1200, c.freq); got != c.want {
			t.Errorf("%s: monthly(1200) = %v, want %v", c.freq, got, c.want)
		}
	}
}

func TestPayoffDate(t *testing.T) {
	from := time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC)

	// 0% loan of 1200 at 100/month: paid off after exactly 12 payments.
	end, ok := payoffDate(1200, 0, 100, model.FrequencyMonthly, from)
	if !ok || !end.Equal(time.Date(2027, 1, 15, 0, 0, 0, 0, time.UTC)) {
		t.Errorf("0%% loan: got %v %v, want 2027-01-15", end, ok)
	}

	// Payment below the monthly interest never pays off.
	if _, ok := payoffDate(100000, 12, 500, model.FrequencyMonthly, from); ok {
		t.Error("payment below interest: want not ok")
	}

	// With interest it takes longer than without.
	withInterest, ok := payoffDate(1200, 12, 100, model.FrequencyMonthly, from)
	if !ok || !withInterest.After(end) {
		t.Errorf("12%% loan: got %v %v, want after %v", withInterest, ok, end)
	}
}

func TestDebtFreeDate(t *testing.T) {
	if got := debtFreeDate([]model.Debt{{HasSchedule: false, Balance: 500}}); got != nil {
		t.Errorf("no scheduled debts: got %v, want nil", *got)
	}
	debts := []model.Debt{
		{HasSchedule: true, Balance: 1200, PaymentAmount: 100, Frequency: model.FrequencyMonthly},
		{HasSchedule: true, Balance: 2400, PaymentAmount: 100, Frequency: model.FrequencyMonthly},
	}
	got := debtFreeDate(debts)
	want := time.Now().UTC().AddDate(0, 24, 0).Format("2006-01-02")
	if got == nil || *got != want {
		t.Errorf("debt-free date = %v, want %s (the later of the two)", got, want)
	}
}
