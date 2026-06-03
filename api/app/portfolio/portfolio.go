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
// Permission enforcement (membership and role) is handled at the HTTP layer
// via middleware. This service contains only business logic.
type Portfolio interface {
	// Create creates a new portfolio and registers callerID as its first owner.
	Create(ctx context.Context, callerID uuid.UUID, req model.CreatePortfolioRequest) (model.Portfolio, error)
	// GetByID fetches a portfolio by ID. Caller access must be verified before calling.
	GetByID(ctx context.Context, id uuid.UUID) (model.Portfolio, error)
	// ListByUser returns the caller's portfolios with optional filters and pagination.
	ListByUser(ctx context.Context, userID uuid.UUID, filter model.ListPortfoliosFilter, page model.Page) ([]model.Portfolio, model.PageInfo, error)
	// Update applies changes to a portfolio. Caller access must be verified before calling.
	Update(ctx context.Context, id uuid.UUID, req model.UpdatePortfolioRequest) (model.Portfolio, error)
	// Delete soft-deletes a portfolio. Caller access must be verified before calling.
	Delete(ctx context.Context, id uuid.UUID) error
	// AddMember adds a user (by email) to the portfolio with the given role.
	// callerID is stored as InvitedBy.
	AddMember(ctx context.Context, portfolioID, callerID uuid.UUID, req model.InviteMemberRequest) error
	// RemoveMember removes a member. Enforces the last-owner guard as business logic.
	RemoveMember(ctx context.Context, portfolioID, targetUserID uuid.UUID) error
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

	// Register the creator as the first owner.
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

	log.Info().Str("portfolio_id", created.ID.String()).Msg("portfolio created")
	return created, nil
}

// GetByID fetches a portfolio by ID. Membership must be verified by middleware.
func (s *service) GetByID(ctx context.Context, id uuid.UUID) (model.Portfolio, error) {
	return s.dp.PortfolioStore.GetPortfolioByID(ctx, id)
}

// ListByUser returns portfolios the caller is a member of.
func (s *service) ListByUser(ctx context.Context, userID uuid.UUID, filter model.ListPortfoliosFilter, page model.Page) ([]model.Portfolio, model.PageInfo, error) {
	return s.dp.PortfolioStore.ListPortfoliosFiltered(ctx, userID, filter, page)
}

// Update applies changes to a portfolio. Permission is verified by middleware.
func (s *service) Update(ctx context.Context, id uuid.UUID, req model.UpdatePortfolioRequest) (model.Portfolio, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "portfolio.Update").
		Logger()

	portfolio, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, id)
	if err != nil {
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

// Delete soft-deletes a portfolio. Permission is verified by middleware.
func (s *service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.dp.PortfolioStore.SoftDeletePortfolio(ctx, id)
}

// AddMember invites a user (by email) to the portfolio.
// The invitee must already have a Silo account. callerID is stored as InvitedBy.
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

// RemoveMember removes a member from the portfolio.
// Business-logic guard: cannot remove the last owner.
// HTTP-layer guard (owner role required) is enforced by middleware.
func (s *service) RemoveMember(ctx context.Context, portfolioID, targetUserID uuid.UUID) error {
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
