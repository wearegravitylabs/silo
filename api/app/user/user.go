// Package user implements user profile management.
package user

import (
	"context"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source user.go -destination ../mock/user/mock_user.go -package user User

// User defines user profile operations.
type User interface {
	GetByID(ctx context.Context, id uuid.UUID) (model.User, error)
	UpdateProfile(ctx context.Context, id uuid.UUID, firstName, lastName string) (model.User, error)
	ChangePassword(ctx context.Context, id uuid.UUID, currentPassword, newPassword string) error
	DeleteAccount(ctx context.Context, id uuid.UUID) error
}

type service struct{ dp app.Dependency }

// New returns a User service.
func New(dp app.Dependency) User { return &service{dp: dp} }

func (s *service) GetByID(ctx context.Context, id uuid.UUID) (model.User, error) {
	return s.dp.UserStore.GetUserByID(ctx, id)
}

func (s *service) UpdateProfile(ctx context.Context, id uuid.UUID, firstName, lastName string) (model.User, error) {
	panic("not implemented")
}

func (s *service) ChangePassword(ctx context.Context, id uuid.UUID, currentPassword, newPassword string) error {
	panic("not implemented")
}

func (s *service) DeleteAccount(ctx context.Context, id uuid.UUID) error {
	return s.dp.UserStore.SoftDeleteUser(ctx, id)
}
