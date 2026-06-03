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
	// Create creates a new portfolio and adds the caller as its first owner.
	Create(ctx context.Context, userID uuid.UUID, req model.CreatePortfolioRequest) (model.Portfolio, error)
	// GetByID fetches a portfolio. The caller must be a member.
	GetByID(ctx context.Context, portfolioID, callerID uuid.UUID) (model.Portfolio, error)
	// ListByUser returns portfolios the caller is a member of, with optional filters and pagination.
	ListByUser(ctx context.Context, userID uuid.UUID, filter model.ListPortfoliosFilter, page model.Page) ([]model.Portfolio, model.PageInfo, error)
	// Update applies changes to a portfolio. Caller must be Owner or Editor.
	Update(ctx context.Context, portfolioID, callerID uuid.UUID, req model.UpdatePortfolioRequest) (model.Portfolio, error)
	// Delete soft-deletes a portfolio. Caller must be Owner.
	Delete(ctx context.Context, portfolioID, callerID uuid.UUID) error
	// AddMember invites a user (by email) to the portfolio. Caller must be Owner.
	AddMember(ctx context.Context, portfolioID, callerID uuid.UUID, req model.InviteMemberRequest) error
	// RemoveMember removes a member. Caller must be Owner. Cannot remove the last owner.
	RemoveMember(ctx context.Context, portfolioID, callerID, targetUserID uuid.UUID) error
	// HasPermission reports whether callerID holds at least minRole on the portfolio.
	HasPermission(ctx context.Context, portfolioID, callerID uuid.UUID, minRole model.PortfolioMemberRole) bool
}

type service struct{ dp app.Dependency }

// New returns a Portfolio service.
func New(dp app.Dependency) Portfolio { return &service{dp: dp} }

// Create creates a new portfolio and registers the caller as its first owner.
func (s *service) Create(ctx context.Context, userID uuid.UUID, req model.CreatePortfolioRequest) (model.Portfolio, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "portfolio.Create").
		Logger()

	if !currency.IsValid(req.BaseCurrency) {
		return model.Portfolio{}, siloErrors.ErrInvalidCurrency
	}

	portfolio := model.Portfolio{
		UserID:       userID,
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
		UserID:      userID,
		Role:        model.RoleOwner,
		Status:      model.MemberStatusAccepted,
		InvitedBy:   userID,
	}
	if err := s.dp.PortfolioStore.AddMember(ctx, member); err != nil {
		log.Error().Err(err).Msg("failed to add owner member after portfolio creation")
		return model.Portfolio{}, err
	}

	log.Info().Str("portfolio_id", created.ID.String()).Msg("portfolio created")
	return created, nil
}

// GetByID fetches a portfolio and verifies the caller is a member.
func (s *service) GetByID(ctx context.Context, portfolioID, callerID uuid.UUID) (model.Portfolio, error) {
	if !s.HasPermission(ctx, portfolioID, callerID, model.RoleViewer) {
		return model.Portfolio{}, siloErrors.ErrInsufficientPermission
	}
	return s.dp.PortfolioStore.GetPortfolioByID(ctx, portfolioID)
}

// ListByUser returns portfolios the caller is a member of.
func (s *service) ListByUser(ctx context.Context, userID uuid.UUID, filter model.ListPortfoliosFilter, page model.Page) ([]model.Portfolio, model.PageInfo, error) {
	return s.dp.PortfolioStore.ListPortfoliosFiltered(ctx, userID, filter, page)
}

// Update applies changes to a portfolio. Caller must be Owner or Editor.
func (s *service) Update(ctx context.Context, portfolioID, callerID uuid.UUID, req model.UpdatePortfolioRequest) (model.Portfolio, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "portfolio.Update").
		Logger()

	if !s.HasPermission(ctx, portfolioID, callerID, model.RoleEditor) {
		return model.Portfolio{}, siloErrors.ErrInsufficientPermission
	}

	portfolio, err := s.dp.PortfolioStore.GetPortfolioByID(ctx, portfolioID)
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

// Delete soft-deletes a portfolio. Caller must be Owner.
func (s *service) Delete(ctx context.Context, portfolioID, callerID uuid.UUID) error {
	if !s.HasPermission(ctx, portfolioID, callerID, model.RoleOwner) {
		return siloErrors.ErrInsufficientPermission
	}
	return s.dp.PortfolioStore.SoftDeletePortfolio(ctx, portfolioID)
}

// AddMember invites a user (by email) to the portfolio. Caller must be Owner.
// The invitee must already have a Silo account.
func (s *service) AddMember(ctx context.Context, portfolioID, callerID uuid.UUID, req model.InviteMemberRequest) error {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "portfolio.AddMember").
		Logger()

	if !s.HasPermission(ctx, portfolioID, callerID, model.RoleOwner) {
		return siloErrors.ErrInsufficientPermission
	}

	// Look up the invitee by email — they must already have a Silo account.
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
		return err // ErrMemberAlreadyExists mapped by store
	}

	log.Info().
		Str("portfolio_id", portfolioID.String()).
		Str("invitee_id", invitee.ID.String()).
		Msg("member added")
	return nil
}

// RemoveMember removes a member from the portfolio. Caller must be Owner.
// Cannot remove the last owner.
func (s *service) RemoveMember(ctx context.Context, portfolioID, callerID, targetUserID uuid.UUID) error {
	if !s.HasPermission(ctx, portfolioID, callerID, model.RoleOwner) {
		return siloErrors.ErrInsufficientPermission
	}

	// Fetch the target member to check their role.
	target, err := s.dp.PortfolioStore.GetMember(ctx, portfolioID, targetUserID)
	if err != nil {
		return siloErrors.ErrPortfolioNotFound
	}

	// Guard: don't orphan the portfolio by removing the last owner.
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

// HasPermission reports whether callerID holds at least minRole on the portfolio.
func (s *service) HasPermission(ctx context.Context, portfolioID, callerID uuid.UUID, minRole model.PortfolioMemberRole) bool {
	member, err := s.dp.PortfolioStore.GetMember(ctx, portfolioID, callerID)
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
