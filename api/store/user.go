package store

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source user.go -destination ./mock/mock_user.go -package mock UserDatabase

// UserDatabase defines all persistence operations for users.
type UserDatabase interface {
	CreateUser(ctx context.Context, user model.User) (model.User, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (model.User, error)
	GetUserByEmail(ctx context.Context, email string) (model.User, error)
	UpdateUser(ctx context.Context, user model.User) (model.User, error)
	SoftDeleteUser(ctx context.Context, id uuid.UUID) error
	IncrementFailedLoginAttempts(ctx context.Context, id uuid.UUID) error
	ResetFailedLoginAttempts(ctx context.Context, id uuid.UUID) error
}

type userStore struct{ storage *Store }

// NewUserStore returns a UserDatabase backed by the given Store.
func NewUserStore(s *Store) UserDatabase { return &userStore{storage: s} }

func (u *userStore) CreateUser(ctx context.Context, user model.User) (model.User, error) {
	result := u.storage.DB.WithContext(ctx).Create(&user)
	if result.Error != nil {
		if strings.Contains(result.Error.Error(), "duplicate key") {
			return model.User{}, siloErrors.ErrUserEmailExists
		}
		return model.User{}, siloErrors.ErrGenericErr
	}
	return user, nil
}

func (u *userStore) GetUserByID(ctx context.Context, id uuid.UUID) (model.User, error) {
	var user model.User
	result := u.storage.DB.WithContext(ctx).Where("id = ? AND deleted_at IS NULL", id).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return model.User{}, siloErrors.ErrUserNotFound
		}
		return model.User{}, siloErrors.ErrGenericErr
	}
	return user, nil
}

func (u *userStore) GetUserByEmail(ctx context.Context, email string) (model.User, error) {
	var user model.User
	result := u.storage.DB.WithContext(ctx).Where("email = ? AND deleted_at IS NULL", strings.ToLower(email)).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return model.User{}, siloErrors.ErrUserNotFound
		}
		return model.User{}, siloErrors.ErrGenericErr
	}
	return user, nil
}

func (u *userStore) UpdateUser(ctx context.Context, user model.User) (model.User, error) {
	result := u.storage.DB.WithContext(ctx).Save(&user)
	if result.Error != nil {
		return model.User{}, siloErrors.ErrGenericErr
	}
	return user, nil
}

func (u *userStore) SoftDeleteUser(ctx context.Context, id uuid.UUID) error {
	result := u.storage.DB.WithContext(ctx).
		Model(&model.User{}).
		Where("id = ?", id).
		Update("deleted_at", gorm.Expr("NOW()"))
	return result.Error
}

func (u *userStore) IncrementFailedLoginAttempts(ctx context.Context, id uuid.UUID) error {
	return u.storage.DB.WithContext(ctx).
		Model(&model.User{}).
		Where("id = ?", id).
		UpdateColumn("failed_login_attempts", gorm.Expr("failed_login_attempts + 1")).Error
}

func (u *userStore) ResetFailedLoginAttempts(ctx context.Context, id uuid.UUID) error {
	return u.storage.DB.WithContext(ctx).
		Model(&model.User{}).
		Where("id = ?", id).
		Updates(map[string]any{"failed_login_attempts": 0, "locked_until": nil}).Error
}
