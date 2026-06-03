package store

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source refresh_token.go -destination ./mock/mock_refresh_token.go -package mock RefreshTokenDatabase

// RefreshTokenDatabase defines persistence operations for refresh tokens.
type RefreshTokenDatabase interface {
	CreateRefreshToken(ctx context.Context, token model.RefreshToken) (model.RefreshToken, error)
	// GetByTokenHash looks up a non-revoked token by its SHA-256 hex hash.
	GetByTokenHash(ctx context.Context, hash string) (model.RefreshToken, error)
	RevokeToken(ctx context.Context, id uuid.UUID) error
	RevokeAllForUser(ctx context.Context, userID uuid.UUID) error
}

type refreshTokenStore struct{ storage *Store }

// NewRefreshTokenStore returns a RefreshTokenDatabase backed by the given Store.
func NewRefreshTokenStore(s *Store) RefreshTokenDatabase {
	return &refreshTokenStore{storage: s}
}

func (r *refreshTokenStore) CreateRefreshToken(ctx context.Context, token model.RefreshToken) (model.RefreshToken, error) {
	if err := r.storage.DB.WithContext(ctx).Create(&token).Error; err != nil {
		return model.RefreshToken{}, siloErrors.ErrGenericErr
	}
	return token, nil
}

func (r *refreshTokenStore) GetByTokenHash(ctx context.Context, hash string) (model.RefreshToken, error) {
	var token model.RefreshToken
	err := r.storage.DB.WithContext(ctx).
		Where("token_hash = ? AND revoked_at IS NULL", hash).
		First(&token).Error
	if err == gorm.ErrRecordNotFound {
		return model.RefreshToken{}, siloErrors.ErrInvalidToken
	}
	if err != nil {
		return model.RefreshToken{}, siloErrors.ErrGenericErr
	}
	return token, nil
}

func (r *refreshTokenStore) RevokeToken(ctx context.Context, id uuid.UUID) error {
	return r.storage.DB.WithContext(ctx).
		Model(&model.RefreshToken{}).
		Where("id = ?", id).
		Update("revoked_at", gorm.Expr("NOW()")).Error
}

func (r *refreshTokenStore) RevokeAllForUser(ctx context.Context, userID uuid.UUID) error {
	return r.storage.DB.WithContext(ctx).
		Model(&model.RefreshToken{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Update("revoked_at", gorm.Expr("NOW()")).Error
}
