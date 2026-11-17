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
	// DeleteAccount soft-deletes a user and everything only they own. See the
	// implementation for exactly what happens.
	DeleteAccount(ctx context.Context, id uuid.UUID) error
	// ListPurgeableFiles returns the storage keys of documents in portfolios
	// soft-deleted before cutoff, so they can be removed before PurgeDeleted.
	ListPurgeableFiles(ctx context.Context, cutoff time.Time) ([]string, error)
	// PurgeDeleted permanently removes users and portfolios soft-deleted
	// before cutoff. It returns how many users and portfolios it removed.
	PurgeDeleted(ctx context.Context, cutoff time.Time) (users, portfolios int64, err error)

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

// DeletedSuffix is added to a deleted user's email and phone number so the
// same email or phone can sign up again as a new account.
const DeletedSuffix = "-deleted"

// DeleteAccount soft-deletes a user in one transaction:
//   - portfolios where they are the only owner are soft-deleted;
//   - portfolios with another owner are handed to that owner;
//   - they are removed from every portfolio they belong to;
//   - their email and phone get DeletedSuffix, so they can sign up again;
//   - all their refresh tokens are revoked.
//
// The rows stay for PurgeDeleted to remove for good later.
func (u *userStore) DeleteAccount(ctx context.Context, id uuid.UUID) error {
	err := u.storage.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Portfolios where nobody else is an owner go with the user.
		if err := tx.Exec(`
			UPDATE portfolios SET deleted_at = NOW()
			WHERE deleted_at IS NULL
			  AND id IN (SELECT portfolio_id FROM portfolio_members WHERE user_id = ? AND role = 'owner')
			  AND NOT EXISTS (
			      SELECT 1 FROM portfolio_members o
			      WHERE o.portfolio_id = portfolios.id AND o.role = 'owner' AND o.status = 'active' AND o.user_id <> ?
			  )`, id, id).Error; err != nil {
			return err
		}
		// Portfolios the user created but someone else also owns stay, under
		// that other owner.
		if err := tx.Exec(`
			UPDATE portfolios p SET user_id = (
			    SELECT o.user_id FROM portfolio_members o
			    WHERE o.portfolio_id = p.id AND o.role = 'owner' AND o.status = 'active' AND o.user_id <> ?
			    ORDER BY o.created_at, o.user_id LIMIT 1
			)
			WHERE p.user_id = ? AND p.deleted_at IS NULL
			  AND EXISTS (
			      SELECT 1 FROM portfolio_members o
			      WHERE o.portfolio_id = p.id AND o.role = 'owner' AND o.status = 'active' AND o.user_id <> ?
			  )`, id, id, id).Error; err != nil {
			return err
		}
		if err := tx.Exec(`DELETE FROM portfolio_members WHERE user_id = ?`, id).Error; err != nil {
			return err
		}
		if err := tx.Exec(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL`, id).Error; err != nil {
			return err
		}
		return tx.Exec(`
			UPDATE users SET
			    email        = email || ?,
			    phone_number = CASE WHEN phone_number IS NULL OR phone_number = '' THEN phone_number ELSE phone_number || ? END,
			    deleted_at   = NOW()
			WHERE id = ? AND deleted_at IS NULL`, DeletedSuffix, DeletedSuffix, id).Error
	})
	if err != nil {
		return siloErrors.ErrGenericErr
	}
	return nil
}

func (u *userStore) ListPurgeableFiles(ctx context.Context, cutoff time.Time) ([]string, error) {
	var keys []string
	err := u.storage.DB.WithContext(ctx).Raw(`
		SELECT d.storage_path FROM asset_documents d
		JOIN portfolios p ON p.id = d.portfolio_id
		WHERE p.deleted_at < ?
		UNION ALL
		SELECT v.storage_path FROM vault_documents v
		JOIN portfolios p ON p.id = v.portfolio_id
		WHERE p.deleted_at < ?`, cutoff, cutoff).Scan(&keys).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return keys, nil
}

func (u *userStore) PurgeDeleted(ctx context.Context, cutoff time.Time) (users, portfolios int64, err error) {
	err = u.storage.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Everything under a portfolio is removed by ON DELETE CASCADE.
		res := tx.Exec(`DELETE FROM portfolios WHERE deleted_at < ?`, cutoff)
		if res.Error != nil {
			return res.Error
		}
		portfolios = res.RowsAffected

		gone := `SELECT id FROM users WHERE deleted_at < ?`
		if err := tx.Exec(`UPDATE portfolio_members SET invited_by = NULL WHERE invited_by IN (`+gone+`)`, cutoff).Error; err != nil {
			return err
		}
		// portfolios.user_id has no ON DELETE rule, so a user still named as
		// a portfolio's creator is skipped rather than failing the purge.
		res = tx.Exec(`
			DELETE FROM users u WHERE u.deleted_at < ?
			  AND NOT EXISTS (SELECT 1 FROM portfolios p WHERE p.user_id = u.id)`, cutoff)
		if res.Error != nil {
			return res.Error
		}
		users = res.RowsAffected
		return nil
	})
	if err != nil {
		return 0, 0, siloErrors.ErrGenericErr
	}
	return users, portfolios, nil
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
