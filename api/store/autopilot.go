package store

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source autopilot.go -destination ./mock/mock_autopilot.go -package mock AutopilotDatabase

// AutopilotDatabase defines all persistence operations for autopilot rules.
type AutopilotDatabase interface {
	CreateRule(ctx context.Context, rule model.AutopilotRule) (model.AutopilotRule, error)
	GetRuleByID(ctx context.Context, id uuid.UUID) (model.AutopilotRule, error)
	ListRulesByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.AutopilotRule, error)
	ListDueRules(ctx context.Context, before time.Time) ([]model.AutopilotRule, error)
	UpdateRule(ctx context.Context, rule model.AutopilotRule) (model.AutopilotRule, error)
	DeleteRule(ctx context.Context, id uuid.UUID) error
}

type autopilotStore struct{ storage *Store }

// NewAutopilotStore returns an AutopilotDatabase backed by the given Store.
func NewAutopilotStore(s *Store) AutopilotDatabase { return &autopilotStore{storage: s} }

func (a *autopilotStore) CreateRule(ctx context.Context, rule model.AutopilotRule) (model.AutopilotRule, error) {
	if err := a.storage.DB.WithContext(ctx).Create(&rule).Error; err != nil {
		return model.AutopilotRule{}, siloErrors.ErrGenericErr
	}
	return rule, nil
}

func (a *autopilotStore) GetRuleByID(ctx context.Context, id uuid.UUID) (model.AutopilotRule, error) {
	var rule model.AutopilotRule
	err := a.storage.DB.WithContext(ctx).Where("id = ?", id).First(&rule).Error
	if err == gorm.ErrRecordNotFound {
		return model.AutopilotRule{}, siloErrors.ErrAutopilotRuleNotFound
	}
	return rule, err
}

func (a *autopilotStore) ListRulesByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.AutopilotRule, error) {
	var rules []model.AutopilotRule
	err := a.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND is_active = true", portfolioID).
		Find(&rules).Error
	return rules, err
}

func (a *autopilotStore) ListDueRules(ctx context.Context, before time.Time) ([]model.AutopilotRule, error) {
	var rules []model.AutopilotRule
	err := a.storage.DB.WithContext(ctx).
		Where("is_active = true AND next_run_at <= ?", before).
		Find(&rules).Error
	return rules, err
}

func (a *autopilotStore) UpdateRule(ctx context.Context, rule model.AutopilotRule) (model.AutopilotRule, error) {
	if err := a.storage.DB.WithContext(ctx).Save(&rule).Error; err != nil {
		return model.AutopilotRule{}, siloErrors.ErrGenericErr
	}
	return rule, nil
}

func (a *autopilotStore) DeleteRule(ctx context.Context, id uuid.UUID) error {
	return a.storage.DB.WithContext(ctx).Where("id = ?", id).Delete(&model.AutopilotRule{}).Error
}
