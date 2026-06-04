// Package user implements user profile management.
package user

import (
	"context"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

//go:generate mockgen -source user.go -destination ../mock/user/mock_user.go -package user User

// User defines user profile operations.
type User interface {
	// GetByID returns the user profile for the given ID.
	GetByID(ctx context.Context, id uuid.UUID) (model.User, error)
	// UpdateProfile applies partial profile changes. Only non-nil fields are updated.
	UpdateProfile(ctx context.Context, id uuid.UUID, req model.UpdateProfileRequest) (model.User, error)
	// DeleteAccount soft-deletes the user's account.
	DeleteAccount(ctx context.Context, id uuid.UUID) error
	// Onboard completes the onboarding flow: sets first/last name + phone, marks is_onboarded = true.
	// Returns ErrAlreadyOnboarded when is_onboarded is already true.
	Onboard(ctx context.Context, id uuid.UUID, req model.OnboardRequest) (model.User, error)
}

type service struct{ dp app.Dependency }

// New returns a User service.
func New(dp app.Dependency) User { return &service{dp: dp} }

// GetByID returns the user profile.
func (s *service) GetByID(ctx context.Context, id uuid.UUID) (model.User, error) {
	return s.dp.UserStore.GetUserByID(ctx, id)
}

// UpdateProfile applies a partial update to the user's profile.
func (s *service) UpdateProfile(ctx context.Context, id uuid.UUID, req model.UpdateProfileRequest) (model.User, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "user.UpdateProfile").
		Logger()

	user, err := s.dp.UserStore.GetUserByID(ctx, id)
	if err != nil {
		return model.User{}, err
	}

	if req.FirstName != nil {
		user.FirstName = *req.FirstName
	}
	if req.LastName != nil {
		user.LastName = *req.LastName
	}
	if req.PhoneNumber != nil {
		user.PhoneNumber = req.PhoneNumber
	}
	if req.PhoneCountryCode != nil {
		user.PhoneCountryCode = req.PhoneCountryCode
	}
	if req.AvatarURL != nil {
		user.AvatarURL = req.AvatarURL
	}

	updated, err := s.dp.UserStore.UpdateUser(ctx, user)
	if err != nil {
		log.Error().Err(err).Msg("failed to update profile")
		return model.User{}, err
	}
	return updated, nil
}

// DeleteAccount soft-deletes the user.
func (s *service) DeleteAccount(ctx context.Context, id uuid.UUID) error {
	return s.dp.UserStore.SoftDeleteUser(ctx, id)
}

// Onboard completes onboarding for the user.
// Returns ErrAlreadyOnboarded when is_onboarded is already true.
func (s *service) Onboard(ctx context.Context, id uuid.UUID, req model.OnboardRequest) (model.User, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "user.Onboard").
		Logger()

	user, err := s.dp.UserStore.GetUserByID(ctx, id)
	if err != nil {
		return model.User{}, err
	}

	if user.IsOnboarded {
		return model.User{}, siloErrors.ErrAlreadyOnboarded
	}

	if err := s.dp.UserStore.CompleteOnboarding(ctx, id, req); err != nil {
		log.Error().Err(err).Msg("failed to complete onboarding")
		return model.User{}, siloErrors.ErrGenericErr
	}

	// Re-fetch to return the updated state.
	updated, err := s.dp.UserStore.GetUserByID(ctx, id)
	if err != nil {
		return model.User{}, err
	}

	log.Info().Str("user_id", id.String()).Msg("user onboarded")
	return updated, nil
}
