package asset

import (
	"context"
	"strconv"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/model"
)

// ExportRows returns every asset in the portfolio as spreadsheet rows, header
// first. Money is shown both in the asset's own currency and, for the owned
// share, in the portfolio's base currency.
func (s *service) ExportRows(ctx context.Context, portfolioID, callerID uuid.UUID) ([][]string, error) {
	assets, err := s.ListByPortfolio(ctx, portfolioID, callerID, model.ListAssetsFilter{})
	if err != nil {
		return nil, err
	}
	folders := folderNames(ctx, s, portfolioID, model.FolderTypeAsset)

	rows := [][]string{{
		"Name", "Type", "Class", "Folder", "Ticker", "Location", "Currency", "Quantity", "Price",
		"Total value", "Ownership %", "Owned value", "Base currency", "Owned value (base)",
		"Invested (base)", "Gain (base)", "Gain %", "1M change %", "Added",
	}}
	for _, a := range assets {
		folder := ""
		if a.FolderID != nil {
			folder = folders[*a.FolderID]
		}
		rows = append(rows, []string{
			a.Name, string(a.AssetType), a.AssetClass, folder, a.Ticker, a.Location, a.Currency,
			num(a.Quantity), num(a.CurrentPrice), num(a.TotalValue), num(a.OwnershipPct), num(a.OwnedValue),
			a.ConvertedCurrency, num(a.OwnedValueConverted),
			optNum(a.Invested), optNum(a.Gain), optNum(a.GainPct), optNum(a.ChangePct1M),
			a.CreatedAt.Format("2006-01-02"),
		})
	}
	return rows, nil
}

func folderNames(ctx context.Context, s *service, portfolioID uuid.UUID, t model.FolderType) map[uuid.UUID]string {
	out := map[uuid.UUID]string{}
	folders, err := s.dp.FolderStore.ListFoldersByPortfolio(ctx, portfolioID, t)
	if err != nil {
		return out
	}
	for _, f := range folders {
		out[f.ID] = f.Name
	}
	return out
}

func num(v float64) string { return strconv.FormatFloat(v, 'f', -1, 64) }

func optNum(v *float64) string {
	if v == nil {
		return ""
	}
	return num(*v)
}
