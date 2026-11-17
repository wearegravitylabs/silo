package debt

import (
	"context"
	"strconv"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/model"
)

// ExportRows returns every debt in the portfolio as spreadsheet rows, header first.
func (s *service) ExportRows(ctx context.Context, portfolioID uuid.UUID) ([][]string, error) {
	debts, err := s.ListByPortfolio(ctx, portfolioID, model.ListDebtsFilter{})
	if err != nil {
		return nil, err
	}
	folders := map[uuid.UUID]string{}
	if list, err := s.dp.FolderStore.ListFoldersByPortfolio(ctx, portfolioID, model.FolderTypeDebt); err == nil {
		for _, f := range list {
			folders[f.ID] = f.Name
		}
	}

	rows := [][]string{{
		"Name", "Type", "Folder", "Currency", "Principal", "Balance", "Ownership %", "Owned balance",
		"Base currency", "Owned balance (base)", "Interest rate %", "Payment", "Frequency", "Scheduled",
		"Monthly payment (base)", "1M change %", "Start date", "Added",
	}}
	for _, d := range debts {
		folder, start := "", ""
		if d.FolderID != nil {
			folder = folders[*d.FolderID]
		}
		if d.StartDate != nil {
			start = d.StartDate.Format("2006-01-02")
		}
		change := ""
		if d.ChangePct1M != nil {
			change = num(*d.ChangePct1M)
		}
		rows = append(rows, []string{
			d.Name, string(d.DebtType), folder, d.Currency, num(d.Principal), num(d.Balance),
			num(d.OwnershipPct), num(round2(d.OwnedBalance)), d.ConvertedCurrency, num(d.OwnedBalanceConverted),
			num(d.InterestRate), num(d.PaymentAmount), string(d.Frequency), strconv.FormatBool(d.HasSchedule),
			num(d.MonthlyPayment), change, start, d.CreatedAt.Format("2006-01-02"),
		})
	}
	return rows, nil
}

func num(v float64) string { return strconv.FormatFloat(v, 'f', -1, 64) }
