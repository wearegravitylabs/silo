// Package portfolio implements portfolio management.
package portfolio

import (
	"context"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	"github.com/wearegravitylabs/silo/api/pkg/currency"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

//go:generate mockgen -source portfolio.go -destination ../mock/portfolio/mock_portfolio.go -package portfolio Portfolio

// Portfolio defines portfolio lifecycle and collaboration operations.
type Portfolio interface {
	// Create creates a new portfolio and registers callerID as its first owner.
	Create(ctx context.Context, callerID uuid.UUID, req model.CreatePortfolioRequest) (model.Portfolio, error)
	// GetByID fetches a portfolio. The store query is scoped to callerID.
	GetByID(ctx context.Context, id, callerID uuid.UUID) (model.Portfolio, error)
	// ListByUser returns the caller's portfolios with optional filters and pagination.
	ListByUser(ctx context.Context, callerID uuid.UUID, filter model.ListPortfoliosFilter, page model.Page) ([]model.Portfolio, model.PageInfo, error)
	// Update applies changes to a portfolio. The store query is scoped to callerID.
	Update(ctx context.Context, id, callerID uuid.UUID, req model.UpdatePortfolioRequest) (model.Portfolio, error)
	// Delete soft-deletes a portfolio. The store query is scoped to callerID.
	Delete(ctx context.Context, id, callerID uuid.UUID) error
	// AddMember adds a user (by email) to the portfolio. callerID is stored as InvitedBy.
	AddMember(ctx context.Context, portfolioID, callerID uuid.UUID, req model.InviteMemberRequest) error
	// RemoveMember removes a member. Enforces the last-owner guard.
	RemoveMember(ctx context.Context, portfolioID, callerID, targetUserID uuid.UUID) error
}

type service struct{ dp app.Dependency }

// New returns a Portfolio service.
func New(dp app.Dependency) Portfolio { return &service{dp: dp} }

// Create creates a new portfolio and registers the caller as its first owner.
func (s *service) Create(ctx context.Context, callerID uuid.UUID, req model.CreatePortfolioRequest) (model.Portfolio, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "portfolio.Create").
		Logger()

	if !currency.IsValid(req.BaseCurrency) {
		return model.Portfolio{}, siloErrors.ErrInvalidCurrency
	}

	portfolio := model.Portfolio{
		UserID:       callerID,
		Name:         req.Name,
		Description:  req.Description,
		BaseCurrency: req.BaseCurrency,
		ImageURL:     req.ImageURL,
	}

	created, err := s.dp.PortfolioStore.CreatePortfolio(ctx, portfolio)
	if err != nil {
		log.Error().Err(err).Msg("failed to create portfolio")
		return model.Portfolio{}, err
	}

	member := model.PortfolioMember{
		PortfolioID: created.ID,
		UserID:      callerID,
		Role:        model.RoleOwner,
		Status:      model.MemberStatusAccepted,
		InvitedBy:   callerID,
	}
	if err := s.dp.PortfolioStore.AddMember(ctx, member); err != nil {
		log.Error().Err(err).Msg("failed to add owner member after portfolio creation")
		return model.Portfolio{}, err
	}

	// Increment the owner's portfolio count. Non-fatal — log on error, don't fail the create.
	if err := s.dp.UserStore.IncrementPortfolioCount(ctx, callerID); err != nil {
		log.Error().Err(err).Msg("failed to increment portfolio_count")
	}

	log.Info().Str("portfolio_id", created.ID.String()).Msg("portfolio created")
	return created, nil
}

// GetByID fetches a portfolio scoped to the caller.
func (s *service) GetByID(ctx context.Context, id, callerID uuid.UUID) (model.Portfolio, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "portfolio.GetByID").
		Str("portfolio_id", id.String()).
		Logger()

	p, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, id, callerID)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch portfolio")
		return model.Portfolio{}, err
	}
	return p, nil
}

// ListByUser returns portfolios the caller is a member of.
func (s *service) ListByUser(ctx context.Context, callerID uuid.UUID, filter model.ListPortfoliosFilter, page model.Page) ([]model.Portfolio, model.PageInfo, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "portfolio.ListByUser").
		Logger()

	portfolios, pageInfo, err := s.dp.PortfolioStore.ListPortfoliosFiltered(ctx, callerID, filter, page)
	if err != nil {
		log.Error().Err(err).Msg("failed to list portfolios")
		return nil, model.PageInfo{}, err
	}
	return portfolios, pageInfo, nil
}

// Update applies changes to a portfolio, scoped to the caller.
func (s *service) Update(ctx context.Context, id, callerID uuid.UUID, req model.UpdatePortfolioRequest) (model.Portfolio, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "portfolio.Update").
		Logger()

	portfolio, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, id, callerID)
	if err != nil {
		log.Error().Err(err).Str("portfolio_id", id.String()).Msg("failed to fetch portfolio for update")
		return model.Portfolio{}, err
	}

	if req.Name != nil {
		portfolio.Name = *req.Name
	}
	if req.Description != nil {
		portfolio.Description = *req.Description
	}
	if req.BaseCurrency != nil {
		if !currency.IsValid(*req.BaseCurrency) {
			return model.Portfolio{}, siloErrors.ErrInvalidCurrency
		}
		portfolio.BaseCurrency = *req.BaseCurrency
	}
	if req.ImageURL != nil {
		portfolio.ImageURL = req.ImageURL
	}

	updated, err := s.dp.PortfolioStore.UpdatePortfolio(ctx, portfolio)
	if err != nil {
		log.Error().Err(err).Msg("failed to update portfolio")
		return model.Portfolio{}, err
	}
	return updated, nil
}

// Delete soft-deletes a portfolio, scoped to the caller.
func (s *service) Delete(ctx context.Context, id, callerID uuid.UUID) error {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "portfolio.Delete").
		Logger()

	// Verify caller is a member before deleting (store-level check).
	if _, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, id, callerID); err != nil {
		return err
	}
	if err := s.dp.PortfolioStore.SoftDeletePortfolio(ctx, id); err != nil {
		return err
	}

	// Decrement the owner's portfolio count. Non-fatal.
	if err := s.dp.UserStore.DecrementPortfolioCount(ctx, callerID); err != nil {
		log.Error().Err(err).Msg("failed to decrement portfolio_count")
	}
	return nil
}

// AddMember invites a user (by email) to the portfolio. callerID is stored as InvitedBy.
func (s *service) AddMember(ctx context.Context, portfolioID, callerID uuid.UUID, req model.InviteMemberRequest) error {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "portfolio.AddMember").
		Logger()

	invitee, err := s.dp.UserStore.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return siloErrors.ErrInviteeNotFound
	}

	member := model.PortfolioMember{
		PortfolioID:  portfolioID,
		UserID:       invitee.ID,
		Role:         req.Role,
		Status:       model.MemberStatusAccepted,
		InvitedBy:    callerID,
		InvitedEmail: &req.Email,
	}
	if err := s.dp.PortfolioStore.AddMember(ctx, member); err != nil {
		return err
	}

	log.Info().
		Str("portfolio_id", portfolioID.String()).
		Str("invitee_id", invitee.ID.String()).
		Msg("member added")
	return nil
}

// RemoveMember removes a member. Business-logic guard: cannot remove the last owner.
func (s *service) RemoveMember(ctx context.Context, portfolioID, callerID, targetUserID uuid.UUID) error {
	// Verify the portfolio is accessible by the caller.
	if _, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, portfolioID, callerID); err != nil {
		return err
	}

	target, err := s.dp.PortfolioStore.GetMember(ctx, portfolioID, targetUserID)
	if err != nil {
		return siloErrors.ErrPortfolioNotFound
	}

	if target.Role == model.RoleOwner {
		ownerCount, err := s.dp.PortfolioStore.CountOwners(ctx, portfolioID)
		if err != nil {
			return siloErrors.ErrGenericErr
		}
		if ownerCount <= 1 {
			return siloErrors.ErrLastOwner
		}
	}

	return s.dp.PortfolioStore.RemoveMember(ctx, portfolioID, targetUserID)
}
