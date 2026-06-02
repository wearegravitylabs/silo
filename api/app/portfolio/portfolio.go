// Package portfolio implements portfolio management.
package portfolio

import (
	"context"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source portfolio.go -destination ../mock/portfolio/mock_portfolio.go -package portfolio Portfolio

// Portfolio defines portfolio lifecycle and collaboration operations.
type Portfolio interface {
	Create(ctx context.Context, userID uuid.UUID, req model.CreatePortfolioRequest) (model.Portfolio, error)
	GetByID(ctx context.Context, id uuid.UUID) (model.Portfolio, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]model.Portfolio, error)
	Update(ctx context.Context, id uuid.UUID, req model.UpdatePortfolioRequest) (model.Portfolio, error)
	Delete(ctx context.Context, id uuid.UUID) error
	AddMember(ctx context.Context, portfolioID uuid.UUID, req model.PortfolioMemberRequest) error
	RemoveMember(ctx context.Context, portfolioID, memberUserID uuid.UUID) error
	HasPermission(ctx context.Context, portfolioID, userID uuid.UUID, minRole model.PortfolioMemberRole) bool
}

type service struct{ dp app.Dependency }

// New returns a Portfolio service.
func New(dp app.Dependency) Portfolio { return &service{dp: dp} }

func (s *service) Create(ctx context.Context, userID uuid.UUID, req model.CreatePortfolioRequest) (model.Portfolio, error) {
	panic("not implemented")
}

func (s *service) GetByID(ctx context.Context, id uuid.UUID) (model.Portfolio, error) {
	return s.dp.PortfolioStore.GetPortfolioByID(ctx, id)
}

func (s *service) ListByUser(ctx context.Context, userID uuid.UUID) ([]model.Portfolio, error) {
	return s.dp.PortfolioStore.ListPortfoliosByUser(ctx, userID)
}

func (s *service) Update(ctx context.Context, id uuid.UUID, req model.UpdatePortfolioRequest) (model.Portfolio, error) {
	panic("not implemented")
}

func (s *service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.dp.PortfolioStore.SoftDeletePortfolio(ctx, id)
}

func (s *service) AddMember(ctx context.Context, portfolioID uuid.UUID, req model.PortfolioMemberRequest) error {
	panic("not implemented")
}

func (s *service) RemoveMember(ctx context.Context, portfolioID, memberUserID uuid.UUID) error {
	return s.dp.PortfolioStore.RemoveMember(ctx, portfolioID, memberUserID)
}

func (s *service) HasPermission(ctx context.Context, portfolioID, userID uuid.UUID, minRole model.PortfolioMemberRole) bool {
	member, err := s.dp.PortfolioStore.GetMember(ctx, portfolioID, userID)
	if err != nil {
		return false
	}
	order := map[model.PortfolioMemberRole]int{
		model.RoleViewer: 1,
		model.RoleEditor: 2,
		model.RoleOwner:  3,
	}
	return order[member.Role] >= order[minRole]
}
