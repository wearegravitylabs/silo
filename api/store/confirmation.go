package store

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

// ConfirmationDatabase persists emailed confirmation codes and email changes.
type ConfirmationDatabase interface {
	// CreateCode stores a new code and retires any unused one for the same
	// user, purpose and target, so only the latest code works.
	CreateCode(ctx context.Context, code model.ConfirmationCode) error
	// LatestCode returns the newest unused, unexpired code.
	LatestCode(ctx context.Context, userID uuid.UUID, purpose model.ConfirmationPurpose, targetID *uuid.UUID) (model.ConfirmationCode, error)
	AddAttempt(ctx context.Context, id uuid.UUID) error
	UseCode(ctx context.Context, id uuid.UUID) error

	// CreateEmailChange stores a pending change, replacing earlier unused ones.
	CreateEmailChange(ctx context.Context, change model.EmailChange) error
	// EmailChangeByToken returns an unused, unexpired change by its token hash.
	EmailChangeByToken(ctx context.Context, tokenHash string) (model.EmailChange, error)
	UseEmailChange(ctx context.Context, id uuid.UUID) error
}

type confirmationStore struct{ storage *Store }

// NewConfirmationStore returns a ConfirmationDatabase backed by the given Store.
func NewConfirmationStore(s *Store) ConfirmationDatabase { return &confirmationStore{storage: s} }

func (c *confirmationStore) CreateCode(ctx context.Context, code model.ConfirmationCode) error {
	err := c.storage.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		q := tx.Model(&model.ConfirmationCode{}).
			Where("user_id = ? AND purpose = ? AND used_at IS NULL", code.UserID, code.Purpose)
		if code.TargetID != nil {
			q = q.Where("target_id = ?", *code.TargetID)
		}
		if err := q.Update("used_at", gorm.Expr("NOW()")).Error; err != nil {
			return err
		}
		return tx.Create(&code).Error
	})
	if err != nil {
		return siloErrors.ErrGenericErr
	}
	return nil
}

func (c *confirmationStore) LatestCode(ctx context.Context, userID uuid.UUID, purpose model.ConfirmationPurpose, targetID *uuid.UUID) (model.ConfirmationCode, error) {
	var code model.ConfirmationCode
	q := c.storage.DB.WithContext(ctx).
		Where("user_id = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?", userID, purpose, time.Now().UTC())
	if targetID != nil {
		q = q.Where("target_id = ?", *targetID)
	}
	err := q.Order("created_at DESC").First(&code).Error
	if err == gorm.ErrRecordNotFound {
		return model.ConfirmationCode{}, siloErrors.ErrRecordNotFound
	}
	if err != nil {
		return model.ConfirmationCode{}, siloErrors.ErrGenericErr
	}
	return code, nil
}

func (c *confirmationStore) AddAttempt(ctx context.Context, id uuid.UUID) error {
	return c.storage.DB.WithContext(ctx).Model(&model.ConfirmationCode{}).
		Where("id = ?", id).Update("attempts", gorm.Expr("attempts + 1")).Error
}

func (c *confirmationStore) UseCode(ctx context.Context, id uuid.UUID) error {
	return c.storage.DB.WithContext(ctx).Model(&model.ConfirmationCode{}).
		Where("id = ?", id).Update("used_at", gorm.Expr("NOW()")).Error
}

func (c *confirmationStore) CreateEmailChange(ctx context.Context, change model.EmailChange) error {
	err := c.storage.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.EmailChange{}).
			Where("user_id = ? AND used_at IS NULL", change.UserID).
			Update("used_at", gorm.Expr("NOW()")).Error; err != nil {
			return err
		}
		return tx.Create(&change).Error
	})
	if err != nil {
		return siloErrors.ErrGenericErr
	}
	return nil
}

func (c *confirmationStore) EmailChangeByToken(ctx context.Context, tokenHash string) (model.EmailChange, error) {
	var change model.EmailChange
	err := c.storage.DB.WithContext(ctx).
		Where("token_hash = ? AND used_at IS NULL AND expires_at > ?", tokenHash, time.Now().UTC()).
		First(&change).Error
	if err == gorm.ErrRecordNotFound {
		return model.EmailChange{}, siloErrors.ErrRecordNotFound
	}
	if err != nil {
		return model.EmailChange{}, siloErrors.ErrGenericErr
	}
	return change, nil
}

func (c *confirmationStore) UseEmailChange(ctx context.Context, id uuid.UUID) error {
	return c.storage.DB.WithContext(ctx).Model(&model.EmailChange{}).
		Where("id = ?", id).Update("used_at", gorm.Expr("NOW()")).Error
}
