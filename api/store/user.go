package store

import (
	"context"
	"errors"
	"strings"
	"time"

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

	// UpsertUserByEmail returns the existing user if found, or creates a new one.
	UpsertUserByEmail(ctx context.Context, email string) (model.User, error)
	// StoreOTP writes a hashed OTP code and its expiry for the given user.
	StoreOTP(ctx context.Context, userID uuid.UUID, hashedCode string, expiry time.Time) error
	// ClearOTP removes the OTP fields and marks the email as verified.
	ClearOTP(ctx context.Context, userID uuid.UUID) error

	// CompleteOnboarding sets the user's profile fields and flips is_onboarded = true atomically.
	CompleteOnboarding(ctx context.Context, userID uuid.UUID, req model.OnboardRequest) error
	// IncrementPortfolioCount atomically adds 1 to the user's portfolio_count.
	IncrementPortfolioCount(ctx context.Context, userID uuid.UUID) error
	// DecrementPortfolioCount atomically subtracts 1 from portfolio_count, floored at 0.
	DecrementPortfolioCount(ctx context.Context, userID uuid.UUID) error
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
	result := u.storage.DB.WithContext(ctx).
		Where("email = ? AND deleted_at IS NULL", strings.ToLower(strings.TrimSpace(email))).
		First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return model.User{}, siloErrors.ErrUserNotFound
		}
		return model.User{}, siloErrors.ErrGenericErr
	}
	return user, nil
}

func (u *userStore) UpdateUser(ctx context.Context, user model.User) (model.User, error) {
	if err := u.storage.DB.WithContext(ctx).Save(&user).Error; err != nil {
		return model.User{}, siloErrors.ErrGenericErr
	}
	return user, nil
}

func (u *userStore) SoftDeleteUser(ctx context.Context, id uuid.UUID) error {
	return u.storage.DB.WithContext(ctx).
		Model(&model.User{}).
		Where("id = ?", id).
		Update("deleted_at", gorm.Expr("NOW()")).Error
}

func (u *userStore) UpsertUserByEmail(ctx context.Context, email string) (model.User, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	var user model.User

	result := u.storage.DB.WithContext(ctx).
		Where("email = ? AND deleted_at IS NULL", email).
		FirstOrCreate(&user, model.User{Email: email})

	if result.Error != nil {
		// Handle rare race-condition duplicate key on concurrent requests
		if strings.Contains(result.Error.Error(), "duplicate key") {
			return u.GetUserByEmail(ctx, email)
		}
		return model.User{}, siloErrors.ErrGenericErr
	}
	return user, nil
}

func (u *userStore) StoreOTP(ctx context.Context, userID uuid.UUID, hashedCode string, expiry time.Time) error {
	return u.storage.DB.WithContext(ctx).
		Model(&model.User{}).
		Where("id = ?", userID).
		Updates(map[string]any{
			"otp_code":   hashedCode,
			"otp_expiry": expiry,
		}).Error
}

func (u *userStore) ClearOTP(ctx context.Context, userID uuid.UUID) error {
	// Use gorm.Expr("NULL") to force writing SQL NULL — GORM skips zero-value fields otherwise.
	return u.storage.DB.WithContext(ctx).
		Model(&model.User{}).
		Where("id = ?", userID).
		Updates(map[string]any{
			"otp_code":          gorm.Expr("NULL"),
			"otp_expiry":        gorm.Expr("NULL"),
			"is_email_verified": true,
		}).Error
}

// CompleteOnboarding sets the user's profile fields and marks is_onboarded = true atomically.
func (u *userStore) CompleteOnboarding(ctx context.Context, userID uuid.UUID, req model.OnboardRequest) error {
	return u.storage.DB.WithContext(ctx).
		Model(&model.User{}).
		Where("id = ?", userID).
		Updates(map[string]any{
			"first_name":         req.FirstName,
			"last_name":          req.LastName,
			"phone_number":       req.PhoneNumber,
			"phone_country_code": req.PhoneCountryCode,
			"is_onboarded":       true,
		}).Error
}

// IncrementPortfolioCount atomically increments portfolio_count by 1.
func (u *userStore) IncrementPortfolioCount(ctx context.Context, userID uuid.UUID) error {
	return u.storage.DB.WithContext(ctx).
		Model(&model.User{}).
		Where("id = ?", userID).
		UpdateColumn("portfolio_count", gorm.Expr("portfolio_count + 1")).Error
}

// DecrementPortfolioCount atomically decrements portfolio_count by 1, floored at 0.
func (u *userStore) DecrementPortfolioCount(ctx context.Context, userID uuid.UUID) error {
	return u.storage.DB.WithContext(ctx).
		Model(&model.User{}).
		Where("id = ?", userID).
		UpdateColumn("portfolio_count", gorm.Expr("GREATEST(portfolio_count - 1, 0)")).Error
}
