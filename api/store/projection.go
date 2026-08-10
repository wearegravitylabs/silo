package store

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

// ProjectionDatabase defines persistence operations for projection scenarios and rules.
type ProjectionDatabase interface {
	// Scenarios
	CreateScenario(ctx context.Context, s model.ProjectionScenario) (model.ProjectionScenario, error)
	GetScenarioByID(ctx context.Context, id uuid.UUID) (model.ProjectionScenario, error)
	ListByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.ProjectionScenario, error)
	UpdateScenario(ctx context.Context, s model.ProjectionScenario) (model.ProjectionScenario, error)
	DeleteScenario(ctx context.Context, id uuid.UUID) error

	// Rules
	AddRule(ctx context.Context, r model.ProjectionRule) (model.ProjectionRule, error)
	GetRuleByID(ctx context.Context, id uuid.UUID) (model.ProjectionRule, error)
	ListRulesByScenario(ctx context.Context, scenarioID uuid.UUID) ([]model.ProjectionRule, error)
	UpdateRule(ctx context.Context, r model.ProjectionRule) (model.ProjectionRule, error)
	DeleteRule(ctx context.Context, id uuid.UUID) error
}

type projectionStore struct{ storage *Store }

func NewProjectionStore(s *Store) ProjectionDatabase {
	return &projectionStore{storage: s}
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

func (p *projectionStore) CreateScenario(ctx context.Context, s model.ProjectionScenario) (model.ProjectionScenario, error) {
	if err := p.storage.DB.WithContext(ctx).Create(&s).Error; err != nil {
		return model.ProjectionScenario{}, siloErrors.ErrGenericErr
	}
	return s, nil
}

func (p *projectionStore) GetScenarioByID(ctx context.Context, id uuid.UUID) (model.ProjectionScenario, error) {
	var s model.ProjectionScenario
	err := p.storage.DB.WithContext(ctx).Where("id = ?", id).First(&s).Error
	if err == gorm.ErrRecordNotFound {
		return model.ProjectionScenario{}, siloErrors.ErrRecordNotFound
	}
	if err != nil {
		return model.ProjectionScenario{}, siloErrors.ErrGenericErr
	}
	return s, nil
}

func (p *projectionStore) ListByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.ProjectionScenario, error) {
	var scenarios []model.ProjectionScenario
	err := p.storage.DB.WithContext(ctx).
		Where("portfolio_id = ?", portfolioID).
		Order("created_at ASC").
		Find(&scenarios).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return scenarios, nil
}

func (p *projectionStore) UpdateScenario(ctx context.Context, s model.ProjectionScenario) (model.ProjectionScenario, error) {
	if err := p.storage.DB.WithContext(ctx).Save(&s).Error; err != nil {
		return model.ProjectionScenario{}, siloErrors.ErrGenericErr
	}
	return s, nil
}

func (p *projectionStore) DeleteScenario(ctx context.Context, id uuid.UUID) error {
	result := p.storage.DB.WithContext(ctx).Delete(&model.ProjectionScenario{}, "id = ?", id)
	if result.Error != nil {
		return siloErrors.ErrGenericErr
	}
	if result.RowsAffected == 0 {
		return siloErrors.ErrRecordNotFound
	}
	return nil
}

// ─── Rules ────────────────────────────────────────────────────────────────────

func (p *projectionStore) AddRule(ctx context.Context, r model.ProjectionRule) (model.ProjectionRule, error) {
	if err := p.storage.DB.WithContext(ctx).Create(&r).Error; err != nil {
		return model.ProjectionRule{}, siloErrors.ErrGenericErr
	}
	return r, nil
}

func (p *projectionStore) GetRuleByID(ctx context.Context, id uuid.UUID) (model.ProjectionRule, error) {
	var r model.ProjectionRule
	err := p.storage.DB.WithContext(ctx).Where("id = ?", id).First(&r).Error
	if err == gorm.ErrRecordNotFound {
		return model.ProjectionRule{}, siloErrors.ErrRecordNotFound
	}
	if err != nil {
		return model.ProjectionRule{}, siloErrors.ErrGenericErr
	}
	return r, nil
}

func (p *projectionStore) ListRulesByScenario(ctx context.Context, scenarioID uuid.UUID) ([]model.ProjectionRule, error) {
	var rules []model.ProjectionRule
	err := p.storage.DB.WithContext(ctx).
		Where("scenario_id = ?", scenarioID).
		Order("created_at ASC").
		Find(&rules).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return rules, nil
}

func (p *projectionStore) UpdateRule(ctx context.Context, r model.ProjectionRule) (model.ProjectionRule, error) {
	if err := p.storage.DB.WithContext(ctx).Save(&r).Error; err != nil {
		return model.ProjectionRule{}, siloErrors.ErrGenericErr
	}
	return r, nil
}

func (p *projectionStore) DeleteRule(ctx context.Context, id uuid.UUID) error {
	result := p.storage.DB.WithContext(ctx).Delete(&model.ProjectionRule{}, "id = ?", id)
	if result.Error != nil {
		return siloErrors.ErrGenericErr
	}
	if result.RowsAffected == 0 {
		return siloErrors.ErrRecordNotFound
	}
	return nil
}
