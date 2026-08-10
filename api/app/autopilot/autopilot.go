// Package autopilot implements automated portfolio update rules.
package autopilot

import (
	"context"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

//go:generate mockgen -source autopilot.go -destination ../mock/autopilot/mock_autopilot.go -package autopilot Autopilot

// Autopilot defines automation rule management and execution.
type Autopilot interface {
	CreateRule(ctx context.Context, portfolioID uuid.UUID, req model.CreateAutopilotRuleRequest) (model.AutopilotRule, error)
	GetRule(ctx context.Context, id uuid.UUID) (model.AutopilotRule, error)
	ListByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.AutopilotRule, error)
	PauseRule(ctx context.Context, id uuid.UUID) error
	ResumeRule(ctx context.Context, id uuid.UUID) error
	DeleteRule(ctx context.Context, id uuid.UUID) error
	// RunDue executes all rules whose next_run_at is in the past. Called by a scheduler.
	RunDue(ctx context.Context) error
}

type service struct{ dp app.Dependency }

// New returns an Autopilot service.
func New(dp app.Dependency) Autopilot { return &service{dp: dp} }

// ─── Rule management ──────────────────────────────────────────────────────────

func (s *service) CreateRule(ctx context.Context, portfolioID uuid.UUID, req model.CreateAutopilotRuleRequest) (model.AutopilotRule, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "autopilot.CreateRule").
		Logger()

	if err := validateRequest(req); err != nil {
		return model.AutopilotRule{}, err
	}

	startDate := req.StartDate
	if startDate.IsZero() {
		startDate = time.Now().UTC()
	}

	rule := model.AutopilotRule{
		PortfolioID: portfolioID,
		TargetID:    req.TargetID,
		TargetType:  req.TargetType,
		Action:      req.Action,
		Amount:      req.Amount,
		Percentage:  req.Percentage,
		Units:       req.Units,
		Frequency:   req.Frequency,
		StartDate:   startDate,
		EndDate:     req.EndDate,
		NextRunAt:   &startDate,
		IsActive:    true,
		CreatedAt:   time.Now().UTC(),
		UpdatedAt:   time.Now().UTC(),
	}

	created, err := s.dp.AutopilotStore.CreateRule(ctx, rule)
	if err != nil {
		log.Error().Err(err).Msg("failed to create autopilot rule")
		return model.AutopilotRule{}, err
	}

	log.Info().Str("rule_id", created.ID.String()).Msg("autopilot rule created")
	return created, nil
}

func (s *service) GetRule(ctx context.Context, id uuid.UUID) (model.AutopilotRule, error) {
	return s.dp.AutopilotStore.GetRuleByID(ctx, id)
}

func (s *service) ListByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.AutopilotRule, error) {
	return s.dp.AutopilotStore.ListRulesByPortfolio(ctx, portfolioID)
}

func (s *service) PauseRule(ctx context.Context, id uuid.UUID) error {
	rule, err := s.dp.AutopilotStore.GetRuleByID(ctx, id)
	if err != nil {
		return err
	}
	rule.IsActive = false
	rule.UpdatedAt = time.Now().UTC()
	_, err = s.dp.AutopilotStore.UpdateRule(ctx, rule)
	return err
}

func (s *service) ResumeRule(ctx context.Context, id uuid.UUID) error {
	rule, err := s.dp.AutopilotStore.GetRuleByID(ctx, id)
	if err != nil {
		return err
	}
	next := advanceDate(time.Now().UTC(), rule.Frequency)
	rule.IsActive = true
	rule.NextRunAt = &next
	rule.UpdatedAt = time.Now().UTC()
	_, err = s.dp.AutopilotStore.UpdateRule(ctx, rule)
	return err
}

func (s *service) DeleteRule(ctx context.Context, id uuid.UUID) error {
	return s.dp.AutopilotStore.DeleteRule(ctx, id)
}

// ─── Execution ────────────────────────────────────────────────────────────────

// RunDue executes all rules whose next_run_at is in the past.
// Safe to call repeatedly — skips rules that are not yet due.
func (s *service) RunDue(ctx context.Context) error {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "autopilot.RunDue").
		Logger()

	rules, err := s.dp.AutopilotStore.ListDueRules(ctx, time.Now().UTC())
	if err != nil {
		return err
	}

	log.Info().Int("count", len(rules)).Msg("executing due autopilot rules")

	for _, rule := range rules {
		if err := s.executeRule(ctx, rule); err != nil {
			log.Error().Err(err).Str("rule_id", rule.ID.String()).Msg("autopilot rule execution failed")
			// Non-fatal — continue with remaining rules.
		}
	}
	return nil
}

func (s *service) executeRule(ctx context.Context, rule model.AutopilotRule) error {
	log := siloLogger.FromCtx(ctx).With().
		Str("rule_id", rule.ID.String()).
		Str("target_type", string(rule.TargetType)).
		Str("action", string(rule.Action)).
		Logger()

	now := time.Now().UTC()

	switch rule.TargetType {
	case model.TargetAsset:
		if err := s.executeAssetRule(ctx, rule, now); err != nil {
			return err
		}
	case model.TargetDebt:
		if err := s.executeDebtRule(ctx, rule, now); err != nil {
			return err
		}
	default:
		log.Warn().Msg("unknown target_type, skipping")
	}

	// Advance schedule.
	next := advanceDate(now, rule.Frequency)
	rule.LastRunAt = &now
	rule.NextRunAt = &next
	if rule.EndDate != nil && next.After(*rule.EndDate) {
		rule.IsActive = false
	}
	rule.UpdatedAt = now
	_, err := s.dp.AutopilotStore.UpdateRule(ctx, rule)
	return err
}

func (s *service) executeAssetRule(ctx context.Context, rule model.AutopilotRule, now time.Time) error {
	asset, err := s.dp.AssetStore.GetAssetByID(ctx, rule.TargetID)
	if err != nil {
		return err
	}

	isTicker := asset.AssetType == model.AssetTypeStockTicker ||
		asset.AssetType == model.AssetTypeCryptoTicker

	if isTicker {
		// Ticker assets: buy more units (DCA). action=add only makes sense here.
		return s.executeBuyTicker(ctx, asset, rule, now)
	}

	// Manual assets: adjust current_price.
	delta := s.calcDelta(rule, asset.CurrentPrice)
	newPrice := asset.CurrentPrice
	switch rule.Action {
	case model.ActionAdd:
		newPrice = round2(asset.CurrentPrice + delta)
	case model.ActionRemove:
		newPrice = math.Max(0, round2(asset.CurrentPrice-delta))
	}

	asset.CurrentPrice = newPrice
	asset.UpdatedAt = now
	if _, err := s.dp.AssetStore.UpdateAsset(ctx, asset); err != nil {
		return err
	}

	// Record value history.
	entry := model.AssetValueHistory{
		AssetID:    asset.ID,
		Value:      round2(newPrice * asset.Quantity),
		Currency:   asset.Currency,
		Source:     model.SourceCron,
		RecordedAt: now,
	}
	_, _ = s.dp.AssetValueHistStore.Create(ctx, entry)
	return nil
}

func (s *service) executeBuyTicker(ctx context.Context, asset model.Asset, rule model.AutopilotRule, now time.Time) error {
	var qty float64
	var price float64

	switch asset.AssetType {
	case model.AssetTypeStockTicker:
		quote, err := s.dp.StockMarket.GetStockQuote(ctx, strings.ToUpper(asset.Ticker))
		if err != nil {
			return err
		}
		price = quote.Price
	case model.AssetTypeCryptoTicker:
		quote, err := s.dp.CryptoMarket.GetCryptoPrice(ctx, asset.Ticker, strings.ToLower(string(asset.Currency)))
		if err != nil {
			return err
		}
		price = quote.Price
	}

	if price <= 0 {
		return siloErrors.ErrGenericErr
	}

	if rule.Units != nil && *rule.Units > 0 {
		// Fixed quantity: "buy 1 TSLA".
		qty = *rule.Units
	} else if rule.Amount > 0 {
		// Dollar DCA: "buy $100 BTC" → qty = amount / price.
		qty = round2(rule.Amount / price)
	} else {
		return siloErrors.ErrInvalidRequest
	}

	if _, err := s.dp.AssetLotStore.CreateLot(ctx, model.AssetLot{
		AssetID:          asset.ID,
		Quantity:         qty,
		AcquisitionDate:  now,
		AcquisitionPrice: &price,
		Notes:            "autopilot",
		CreatedAt:        now,
	}); err != nil {
		return err
	}

	// Sync quantity.
	total, err := s.dp.AssetLotStore.SumQuantity(ctx, asset.ID)
	if err == nil {
		asset.Quantity = total
		asset.CurrentPrice = price
		asset.UpdatedAt = now
		if updated, err := s.dp.AssetStore.UpdateAsset(ctx, asset); err == nil {
			entry := model.AssetValueHistory{
				AssetID:    asset.ID,
				Value:      round2(updated.CurrentPrice * updated.Quantity),
				Currency:   updated.Currency,
				Source:     model.SourceCron,
				RecordedAt: now,
			}
			_, _ = s.dp.AssetValueHistStore.Create(ctx, entry)
		}
	}
	return nil
}

func (s *service) executeDebtRule(ctx context.Context, rule model.AutopilotRule, now time.Time) error {
	debt, err := s.dp.DebtStore.GetDebtByID(ctx, rule.TargetID)
	if err != nil {
		return err
	}

	delta := s.calcDelta(rule, debt.Balance)
	switch rule.Action {
	case model.ActionRemove:
		debt.Balance = math.Max(0, round2(debt.Balance-delta))
	case model.ActionAdd:
		debt.Balance = round2(debt.Balance + delta)
	}

	debt.UpdatedAt = now
	_, err = s.dp.DebtStore.UpdateDebt(ctx, debt)
	return err
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func (s *service) calcDelta(rule model.AutopilotRule, currentValue float64) float64 {
	if rule.Amount > 0 {
		return rule.Amount
	}
	if rule.Percentage > 0 {
		return round2(currentValue * (rule.Percentage / 100))
	}
	return 0
}

func advanceDate(from time.Time, freq model.PaymentFrequency) time.Time {
	switch freq {
	case model.FrequencyWeekly:
		return from.AddDate(0, 0, 7)
	case model.FrequencyBiweekly:
		return from.AddDate(0, 0, 14)
	case model.FrequencyMonthly:
		return from.AddDate(0, 1, 0)
	case model.FrequencyQuarterly:
		return from.AddDate(0, 3, 0)
	case model.FrequencyBiannual:
		return from.AddDate(0, 6, 0)
	case model.FrequencyAnnually:
		return from.AddDate(1, 0, 0)
	default:
		return from.AddDate(0, 1, 0)
	}
}

func validateRequest(req model.CreateAutopilotRuleRequest) error {
	if req.TargetType != model.TargetAsset && req.TargetType != model.TargetDebt {
		return siloErrors.ErrInvalidRequest
	}
	if req.Action != model.ActionAdd && req.Action != model.ActionRemove {
		return siloErrors.ErrInvalidRequest
	}
	// Exactly one value spec must be non-zero.
	count := 0
	if req.Amount > 0 {
		count++
	}
	if req.Percentage > 0 {
		count++
	}
	if req.Units != nil && *req.Units > 0 {
		count++
	}
	if count != 1 {
		return siloErrors.ErrInvalidRequest
	}
	return nil
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
