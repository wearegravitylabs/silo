package store

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source asset_document.go -destination ./mock/mock_asset_document.go -package mock AssetDocumentDatabase

// AssetDocumentDatabase defines all persistence operations for asset documents.
type AssetDocumentDatabase interface {
	CreateDocument(ctx context.Context, doc model.AssetDocument) (model.AssetDocument, error)
	GetDocumentByID(ctx context.Context, id uuid.UUID) (model.AssetDocument, error)
	ListByAsset(ctx context.Context, assetID uuid.UUID) ([]model.AssetDocument, error)
	SoftDeleteDocument(ctx context.Context, id uuid.UUID) error
}

type assetDocumentStore struct{ storage *Store }

// NewAssetDocumentStore returns an AssetDocumentDatabase backed by the given Store.
func NewAssetDocumentStore(s *Store) AssetDocumentDatabase {
	return &assetDocumentStore{storage: s}
}

// CreateDocument persists a new document record.
func (a *assetDocumentStore) CreateDocument(ctx context.Context, doc model.AssetDocument) (model.AssetDocument, error) {
	if err := a.storage.DB.WithContext(ctx).Create(&doc).Error; err != nil {
		return model.AssetDocument{}, siloErrors.ErrGenericErr
	}
	return doc, nil
}

// GetDocumentByID fetches a single document by its primary key.
func (a *assetDocumentStore) GetDocumentByID(ctx context.Context, id uuid.UUID) (model.AssetDocument, error) {
	var doc model.AssetDocument
	err := a.storage.DB.WithContext(ctx).
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

// ListByAsset returns all non-deleted documents for an asset.
func (a *assetDocumentStore) ListByAsset(ctx context.Context, assetID uuid.UUID) ([]model.AssetDocument, error) {
	var docs []model.AssetDocument
	err := a.storage.DB.WithContext(ctx).
		Where("asset_id = ? AND deleted_at IS NULL", assetID).
		Order("uploaded_at DESC").
		Find(&docs).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return docs, nil
}

// SoftDeleteDocument marks a document as deleted without removing the DB row.
func (a *assetDocumentStore) SoftDeleteDocument(ctx context.Context, id uuid.UUID) error {
	result := a.storage.DB.WithContext(ctx).
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
