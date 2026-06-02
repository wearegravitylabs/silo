// Package auth implements user authentication and session management.
package auth

import (
	"context"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source auth.go -destination ../mock/auth/mock_auth.go -package auth Auth

// Auth defines authentication operations.
type Auth interface {
	SignUp(ctx context.Context, req model.UserSignup) (model.User, string, error)
	Login(ctx context.Context, email string, password model.Password) (model.User, string, error)
	VerifyEmail(ctx context.Context, userID uuid.UUID, otp string) error
	ForgotPassword(ctx context.Context, email string) error
	ResetPassword(ctx context.Context, userID uuid.UUID, otp, newPassword string) error
	RefreshToken(ctx context.Context, userID uuid.UUID) (string, error)
}

type service struct{ dp app.Dependency }

// New returns an Auth service.
func New(dp app.Dependency) Auth { return &service{dp: dp} }

func (s *service) SignUp(ctx context.Context, req model.UserSignup) (model.User, string, error) {
	// TODO: implement — hash password, create user, generate OTP, send verification email, issue JWT
	panic("not implemented")
}

func (s *service) Login(ctx context.Context, email string, password model.Password) (model.User, string, error) {
	// TODO: implement — fetch user, check password, check lock, issue JWT
	panic("not implemented")
}

func (s *service) VerifyEmail(ctx context.Context, userID uuid.UUID, otp string) error {
	panic("not implemented")
}

func (s *service) ForgotPassword(ctx context.Context, email string) error {
	panic("not implemented")
}

func (s *service) ResetPassword(ctx context.Context, userID uuid.UUID, otp, newPassword string) error {
	panic("not implemented")
}

func (s *service) RefreshToken(ctx context.Context, userID uuid.UUID) (string, error) {
	panic("not implemented")
}
