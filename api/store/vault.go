package store

import (
	"context"
	"time"

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
	// ListByPortfolio returns the portfolio's vault documents (whoever
	// uploaded them), newest first.
	ListByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.VaultDocument, error)
	SoftDeleteDocument(ctx context.Context, id uuid.UUID) error
	// ReplaceFile points a document at a newly uploaded file (e.g. its
	// encrypted version) and updates its encryption details.
	ReplaceFile(ctx context.Context, doc model.VaultDocument) error

	GetVault(ctx context.Context, portfolioID uuid.UUID) (model.PortfolioVault, error)
	// CreateVault stores the first password; ErrDuplicateRecord when one exists.
	CreateVault(ctx context.Context, vault model.PortfolioVault) error
	UpdateVault(ctx context.Context, vault model.PortfolioVault) error

	// LockedUntil returns when unlocking is blocked for the user (zero when it isn't).
	LockedUntil(ctx context.Context, portfolioID, userID uuid.UUID) (time.Time, error)
	// FailUnlock counts a wrong password and blocks unlocking until lockUntil
	// once max wrong tries in a row are reached. It returns the new lock time.
	FailUnlock(ctx context.Context, portfolioID, userID uuid.UUID, max int, lockUntil time.Time) (time.Time, error)
	ResetUnlock(ctx context.Context, portfolioID, userID uuid.UUID) error
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

func (v *vaultStore) ListByPortfolio(ctx context.Context, portfolioID uuid.UUID) ([]model.VaultDocument, error) {
	var docs []model.VaultDocument
	err := v.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND deleted_at IS NULL", portfolioID).
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

func (v *vaultStore) ReplaceFile(ctx context.Context, doc model.VaultDocument) error {
	err := v.storage.DB.WithContext(ctx).Model(&model.VaultDocument{}).Where("id = ?", doc.ID).
		Updates(map[string]any{
			"storage_path": doc.StoragePath, "file_size": doc.FileSize, "file_type": doc.FileType,
			"encrypted": doc.Encrypted, "encryption": doc.Encryption,
		}).Error
	if err != nil {
		return siloErrors.ErrGenericErr
	}
	return nil
}

func (v *vaultStore) GetVault(ctx context.Context, portfolioID uuid.UUID) (model.PortfolioVault, error) {
	var vault model.PortfolioVault
	err := v.storage.DB.WithContext(ctx).Where("portfolio_id = ?", portfolioID).First(&vault).Error
	if err == gorm.ErrRecordNotFound {
		return model.PortfolioVault{}, siloErrors.ErrRecordNotFound
	}
	if err != nil {
		return model.PortfolioVault{}, siloErrors.ErrGenericErr
	}
	return vault, nil
}

func (v *vaultStore) CreateVault(ctx context.Context, vault model.PortfolioVault) error {
	if err := v.storage.DB.WithContext(ctx).Create(&vault).Error; err != nil {
		return siloErrors.ErrDuplicateRecord
	}
	return nil
}

func (v *vaultStore) UpdateVault(ctx context.Context, vault model.PortfolioVault) error {
	if err := v.storage.DB.WithContext(ctx).Save(&vault).Error; err != nil {
		return siloErrors.ErrGenericErr
	}
	return nil
}

func (v *vaultStore) LockedUntil(ctx context.Context, portfolioID, userID uuid.UUID) (time.Time, error) {
	var row struct{ LockedUntil *time.Time }
	err := v.storage.DB.WithContext(ctx).Raw(
		`SELECT locked_until FROM vault_unlock_attempts WHERE portfolio_id = ? AND user_id = ?`,
		portfolioID, userID).Scan(&row).Error
	if err != nil {
		return time.Time{}, siloErrors.ErrGenericErr
	}
	if row.LockedUntil == nil {
		return time.Time{}, nil
	}
	return *row.LockedUntil, nil
}

func (v *vaultStore) FailUnlock(ctx context.Context, portfolioID, userID uuid.UUID, max int, lockUntil time.Time) (time.Time, error) {
	var row struct{ LockedUntil *time.Time }
	err := v.storage.DB.WithContext(ctx).Raw(`
		INSERT INTO vault_unlock_attempts (portfolio_id, user_id, failed) VALUES (?, ?, 1)
		ON CONFLICT (portfolio_id, user_id) DO UPDATE SET failed = vault_unlock_attempts.failed + 1
		RETURNING CASE WHEN failed >= ? THEN ?::timestamptz END AS locked_until`,
		portfolioID, userID, max, lockUntil).Scan(&row).Error
	if err != nil {
		return time.Time{}, siloErrors.ErrGenericErr
	}
	if row.LockedUntil == nil {
		return time.Time{}, nil
	}
	err = v.storage.DB.WithContext(ctx).Exec(
		`UPDATE vault_unlock_attempts SET locked_until = ?, failed = 0 WHERE portfolio_id = ? AND user_id = ?`,
		*row.LockedUntil, portfolioID, userID).Error
	if err != nil {
		return time.Time{}, siloErrors.ErrGenericErr
	}
	return *row.LockedUntil, nil
}

func (v *vaultStore) ResetUnlock(ctx context.Context, portfolioID, userID uuid.UUID) error {
	return v.storage.DB.WithContext(ctx).Exec(
		`DELETE FROM vault_unlock_attempts WHERE portfolio_id = ? AND user_id = ?`, portfolioID, userID).Error
}
