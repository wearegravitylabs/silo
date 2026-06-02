package store

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source portfolio.go -destination ./mock/mock_portfolio.go -package mock PortfolioDatabase

// PortfolioDatabase defines all persistence operations for portfolios.
type PortfolioDatabase interface {
	CreatePortfolio(ctx context.Context, portfolio model.Portfolio) (model.Portfolio, error)
	GetPortfolioByID(ctx context.Context, id uuid.UUID) (model.Portfolio, error)
	ListPortfoliosByUser(ctx context.Context, userID uuid.UUID) ([]model.Portfolio, error)
	UpdatePortfolio(ctx context.Context, portfolio model.Portfolio) (model.Portfolio, error)
	SoftDeletePortfolio(ctx context.Context, id uuid.UUID) error
	AddMember(ctx context.Context, member model.PortfolioMember) error
	RemoveMember(ctx context.Context, portfolioID, userID uuid.UUID) error
	GetMember(ctx context.Context, portfolioID, userID uuid.UUID) (model.PortfolioMember, error)
	ListMembers(ctx context.Context, portfolioID uuid.UUID) ([]model.PortfolioMember, error)
}

type portfolioStore struct{ storage *Store }

// NewPortfolioStore returns a PortfolioDatabase backed by the given Store.
func NewPortfolioStore(s *Store) PortfolioDatabase { return &portfolioStore{storage: s} }

func (p *portfolioStore) CreatePortfolio(ctx context.Context, portfolio model.Portfolio) (model.Portfolio, error) {
	if err := p.storage.DB.WithContext(ctx).Create(&portfolio).Error; err != nil {
		return model.Portfolio{}, siloErrors.ErrGenericErr
	}
	return portfolio, nil
}

func (p *portfolioStore) GetPortfolioByID(ctx context.Context, id uuid.UUID) (model.Portfolio, error) {
	var portfolio model.Portfolio
	err := p.storage.DB.WithContext(ctx).
		Preload("Members").
		Where("id = ? AND deleted_at IS NULL", id).
		First(&portfolio).Error
	if err == gorm.ErrRecordNotFound {
		return model.Portfolio{}, siloErrors.ErrPortfolioNotFound
	}
	if err != nil {
		return model.Portfolio{}, siloErrors.ErrGenericErr
	}
	return portfolio, nil
}

func (p *portfolioStore) ListPortfoliosByUser(ctx context.Context, userID uuid.UUID) ([]model.Portfolio, error) {
	var portfolios []model.Portfolio
	err := p.storage.DB.WithContext(ctx).
		Joins("JOIN portfolio_members ON portfolio_members.portfolio_id = portfolios.id").
		Where("portfolio_members.user_id = ? AND portfolios.deleted_at IS NULL", userID).
		Find(&portfolios).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return portfolios, nil
}

func (p *portfolioStore) UpdatePortfolio(ctx context.Context, portfolio model.Portfolio) (model.Portfolio, error) {
	if err := p.storage.DB.WithContext(ctx).Save(&portfolio).Error; err != nil {
		return model.Portfolio{}, siloErrors.ErrGenericErr
	}
	return portfolio, nil
}

func (p *portfolioStore) SoftDeletePortfolio(ctx context.Context, id uuid.UUID) error {
	return p.storage.DB.WithContext(ctx).
		Model(&model.Portfolio{}).
		Where("id = ?", id).
		Update("deleted_at", gorm.Expr("NOW()")).Error
}

func (p *portfolioStore) AddMember(ctx context.Context, member model.PortfolioMember) error {
	if err := p.storage.DB.WithContext(ctx).Create(&member).Error; err != nil {
		return siloErrors.ErrMemberAlreadyExists
	}
	return nil
}

func (p *portfolioStore) RemoveMember(ctx context.Context, portfolioID, userID uuid.UUID) error {
	return p.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND user_id = ?", portfolioID, userID).
		Delete(&model.PortfolioMember{}).Error
}

func (p *portfolioStore) GetMember(ctx context.Context, portfolioID, userID uuid.UUID) (model.PortfolioMember, error) {
	var member model.PortfolioMember
	err := p.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND user_id = ?", portfolioID, userID).
		First(&member).Error
	if err == gorm.ErrRecordNotFound {
		return model.PortfolioMember{}, siloErrors.ErrRecordNotFound
	}
	return member, err
}

func (p *portfolioStore) ListMembers(ctx context.Context, portfolioID uuid.UUID) ([]model.PortfolioMember, error) {
	var members []model.PortfolioMember
	err := p.storage.DB.WithContext(ctx).Where("portfolio_id = ?", portfolioID).Find(&members).Error
	return members, err
}
