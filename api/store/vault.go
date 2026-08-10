package store

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source vault.go -destination ./mock/mock_vault.go -package mock VaultDatabase

// VaultDatabase defines persistence operations for vault documents.
type VaultDatabase interface {
	CreateDocument(ctx context.Context, doc model.VaultDocument) (model.VaultDocument, error)
	GetDocumentByID(ctx context.Context, id uuid.UUID) (model.VaultDocument, error)
	ListByPortfolio(ctx context.Context, userID, portfolioID uuid.UUID) ([]model.VaultDocument, error)
	SoftDeleteDocument(ctx context.Context, id uuid.UUID) error
}

type vaultStore struct{ storage *Store }

// NewVaultStore returns a VaultDatabase backed by the given Store.
func NewVaultStore(s *Store) VaultDatabase {
	return &vaultStore{storage: s}
}

func (v *vaultStore) CreateDocument(ctx context.Context, doc model.VaultDocument) (model.VaultDocument, error) {
	if err := v.storage.DB.WithContext(ctx).Create(&doc).Error; err != nil {
		return model.VaultDocument{}, siloErrors.ErrGenericErr
	}
	return doc, nil
}

// GetDocumentByID fetches a single vault document by its primary key.
func (v *vaultStore) GetDocumentByID(ctx context.Context, id uuid.UUID) (model.VaultDocument, error) {
	var doc model.VaultDocument
	err := v.storage.DB.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", id).
		First(&doc).Error
	if err == gorm.ErrRecordNotFound {
		return model.VaultDocument{}, siloErrors.ErrRecordNotFound
	}
	if err != nil {
		return model.VaultDocument{}, siloErrors.ErrGenericErr
	}
	return doc, nil
}

// ListByPortfolio returns all non-deleted vault documents for a user's portfolio, newest first.
func (v *vaultStore) ListByPortfolio(ctx context.Context, userID, portfolioID uuid.UUID) ([]model.VaultDocument, error) {
	var docs []model.VaultDocument
	err := v.storage.DB.WithContext(ctx).
		Where("user_id = ? AND portfolio_id = ? AND deleted_at IS NULL", userID, portfolioID).
		Order("uploaded_at DESC").
		Find(&docs).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return docs, nil
}

// SoftDeleteDocument marks a vault document as deleted without removing the DB row.
func (v *vaultStore) SoftDeleteDocument(ctx context.Context, id uuid.UUID) error {
	result := v.storage.DB.WithContext(ctx).
		Model(&model.VaultDocument{}).
		Where("id = ?", id).
		Update("deleted_at", gorm.Expr("NOW()"))
	if result.Error != nil {
		return siloErrors.ErrGenericErr
	}
	if result.RowsAffected == 0 {
		return siloErrors.ErrRecordNotFound
	}
	return nil
}
