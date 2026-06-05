package store

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source asset_document.go -destination ./mock/mock_asset_document.go -package mock DocumentDatabase

// DocumentDatabase defines all persistence operations for attached documents.
// The same table backs documents for assets, debts, and any future entity type.
type DocumentDatabase interface {
	CreateDocument(ctx context.Context, doc model.AssetDocument) (model.AssetDocument, error)
	GetDocumentByID(ctx context.Context, id uuid.UUID) (model.AssetDocument, error)
	// ListByAsset returns all non-deleted documents attached to a specific asset.
	ListByAsset(ctx context.Context, assetID uuid.UUID) ([]model.AssetDocument, error)
	// ListByDebt returns all non-deleted documents attached to a specific debt.
	ListByDebt(ctx context.Context, debtID uuid.UUID) ([]model.AssetDocument, error)
	SoftDeleteDocument(ctx context.Context, id uuid.UUID) error
}

type documentStore struct{ storage *Store }

// NewAssetDocumentStore returns a DocumentDatabase backed by the given Store.
// Named for backward compatibility; handles documents for any entity type.
func NewAssetDocumentStore(s *Store) DocumentDatabase {
	return &documentStore{storage: s}
}

// CreateDocument persists a new document record.
func (d *documentStore) CreateDocument(ctx context.Context, doc model.AssetDocument) (model.AssetDocument, error) {
	if err := d.storage.DB.WithContext(ctx).Create(&doc).Error; err != nil {
		return model.AssetDocument{}, siloErrors.ErrGenericErr
	}
	return doc, nil
}

// GetDocumentByID fetches a single document by its primary key.
func (d *documentStore) GetDocumentByID(ctx context.Context, id uuid.UUID) (model.AssetDocument, error) {
	var doc model.AssetDocument
	err := d.storage.DB.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", id).
		First(&doc).Error
	if err == gorm.ErrRecordNotFound {
		return model.AssetDocument{}, siloErrors.ErrRecordNotFound
	}
	if err != nil {
		return model.AssetDocument{}, siloErrors.ErrGenericErr
	}
	return doc, nil
}

// ListByAsset returns all non-deleted documents for an asset, newest first.
func (d *documentStore) ListByAsset(ctx context.Context, assetID uuid.UUID) ([]model.AssetDocument, error) {
	var docs []model.AssetDocument
	err := d.storage.DB.WithContext(ctx).
		Where("asset_id = ? AND deleted_at IS NULL", assetID).
		Order("uploaded_at DESC").
		Find(&docs).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return docs, nil
}

// ListByDebt returns all non-deleted documents for a debt, newest first.
func (d *documentStore) ListByDebt(ctx context.Context, debtID uuid.UUID) ([]model.AssetDocument, error) {
	var docs []model.AssetDocument
	err := d.storage.DB.WithContext(ctx).
		Where("debt_id = ? AND deleted_at IS NULL", debtID).
		Order("uploaded_at DESC").
		Find(&docs).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return docs, nil
}

// SoftDeleteDocument marks a document as deleted without removing the DB row.
func (d *documentStore) SoftDeleteDocument(ctx context.Context, id uuid.UUID) error {
	result := d.storage.DB.WithContext(ctx).
		Model(&model.AssetDocument{}).
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
