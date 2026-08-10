package store

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source asset_note.go -destination ./mock/mock_asset_note.go -package mock NoteDatabase

// NoteDatabase defines all persistence operations for entity notes.
// The same table backs notes for assets, debts, and any future entity type.
type NoteDatabase interface {
	CreateNote(ctx context.Context, note model.AssetNote) (model.AssetNote, error)
	GetNoteByID(ctx context.Context, id uuid.UUID) (model.AssetNote, error)
	UpdateNote(ctx context.Context, id uuid.UUID, title, content string, tags model.JSONB) (model.AssetNote, error)
	// ListByAsset returns all non-deleted notes attached to a specific asset, newest first.
	ListByAsset(ctx context.Context, assetID uuid.UUID) ([]model.AssetNote, error)
	// ListByDebt returns all non-deleted notes attached to a specific debt, newest first.
	ListByDebt(ctx context.Context, debtID uuid.UUID) ([]model.AssetNote, error)
	SoftDeleteNote(ctx context.Context, id uuid.UUID) error
}

type noteStore struct{ storage *Store }

// NewAssetNoteStore returns a NoteDatabase backed by the given Store.
func NewAssetNoteStore(s *Store) NoteDatabase {
	return &noteStore{storage: s}
}

// CreateNote persists a new note record.
func (n *noteStore) CreateNote(ctx context.Context, note model.AssetNote) (model.AssetNote, error) {
	if err := n.storage.DB.WithContext(ctx).Create(&note).Error; err != nil {
		return model.AssetNote{}, siloErrors.ErrGenericErr
	}
	return note, nil
}

// GetNoteByID fetches a single note by its primary key.
func (n *noteStore) GetNoteByID(ctx context.Context, id uuid.UUID) (model.AssetNote, error) {
	var note model.AssetNote
	err := n.storage.DB.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", id).
		First(&note).Error
	if err == gorm.ErrRecordNotFound {
		return model.AssetNote{}, siloErrors.ErrRecordNotFound
	}
	if err != nil {
		return model.AssetNote{}, siloErrors.ErrGenericErr
	}
	return note, nil
}

// UpdateNote applies title and content changes to an existing note.
func (n *noteStore) UpdateNote(ctx context.Context, id uuid.UUID, title, content string, tags model.JSONB) (model.AssetNote, error) {
	result := n.storage.DB.WithContext(ctx).
		Model(&model.AssetNote{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Updates(map[string]any{
			"title":      title,
			"content":    content,
			"tags":       tags,
			"updated_at": time.Now().UTC(),
		})
	if result.Error != nil {
		return model.AssetNote{}, siloErrors.ErrGenericErr
	}
	if result.RowsAffected == 0 {
		return model.AssetNote{}, siloErrors.ErrRecordNotFound
	}
	return n.GetNoteByID(ctx, id)
}

// ListByAsset returns all non-deleted notes for an asset, newest first.
func (n *noteStore) ListByAsset(ctx context.Context, assetID uuid.UUID) ([]model.AssetNote, error) {
	var notes []model.AssetNote
	err := n.storage.DB.WithContext(ctx).
		Where("asset_id = ? AND deleted_at IS NULL", assetID).
		Order("created_at DESC").
		Find(&notes).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return notes, nil
}

// ListByDebt returns all non-deleted notes for a debt, newest first.
func (n *noteStore) ListByDebt(ctx context.Context, debtID uuid.UUID) ([]model.AssetNote, error) {
	var notes []model.AssetNote
	err := n.storage.DB.WithContext(ctx).
		Where("debt_id = ? AND deleted_at IS NULL", debtID).
		Order("created_at DESC").
		Find(&notes).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return notes, nil
}

// SoftDeleteNote marks a note as deleted without removing the DB row.
func (n *noteStore) SoftDeleteNote(ctx context.Context, id uuid.UUID) error {
	result := n.storage.DB.WithContext(ctx).
		Model(&model.AssetNote{}).
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
