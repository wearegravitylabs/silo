package store

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source folder.go -destination ./mock/mock_folder.go -package mock FolderDatabase

// FolderDatabase defines all persistence operations for folders.
type FolderDatabase interface {
	CreateFolder(ctx context.Context, folder model.Folder) (model.Folder, error)
	GetFolderByID(ctx context.Context, id uuid.UUID) (model.Folder, error)
	// ListFoldersByPortfolio returns folders of the given type, ordered by position ascending.
	ListFoldersByPortfolio(ctx context.Context, portfolioID uuid.UUID, folderType model.FolderType) ([]model.Folder, error)
	UpdateFolder(ctx context.Context, folder model.Folder) (model.Folder, error)
	DeleteFolder(ctx context.Context, id uuid.UUID) error
	// MaxPosition returns the highest existing position value within a portfolio for the given type.
	// Returns -1 when no folders of that type exist yet (so the first folder gets position 0).
	MaxPosition(ctx context.Context, portfolioID uuid.UUID, folderType model.FolderType) (int, error)
	// ReorderFolders applies all position updates atomically in one transaction.
	ReorderFolders(ctx context.Context, portfolioID uuid.UUID, positions []model.FolderPosition) error
}

type folderStore struct{ storage *Store }

// NewFolderStore returns a FolderDatabase backed by the given Store.
func NewFolderStore(s *Store) FolderDatabase { return &folderStore{storage: s} }

// CreateFolder persists a new folder and returns it with its generated ID.
func (f *folderStore) CreateFolder(ctx context.Context, folder model.Folder) (model.Folder, error) {
	if err := f.storage.DB.WithContext(ctx).Create(&folder).Error; err != nil {
		return model.Folder{}, siloErrors.ErrGenericErr
	}
	return folder, nil
}

// GetFolderByID fetches a single folder by its primary key.
func (f *folderStore) GetFolderByID(ctx context.Context, id uuid.UUID) (model.Folder, error) {
	var folder model.Folder
	err := f.storage.DB.WithContext(ctx).Where("id = ?", id).First(&folder).Error
	if err == gorm.ErrRecordNotFound {
		return model.Folder{}, siloErrors.ErrFolderNotFound
	}
	if err != nil {
		return model.Folder{}, siloErrors.ErrGenericErr
	}
	return folder, nil
}

// ListFoldersByPortfolio returns folders of the given type for a portfolio, ordered by position ascending.
func (f *folderStore) ListFoldersByPortfolio(ctx context.Context, portfolioID uuid.UUID, folderType model.FolderType) ([]model.Folder, error) {
	var folders []model.Folder
	err := f.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND folder_type = ?", portfolioID, folderType).
		Order("position ASC").
		Find(&folders).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return folders, nil
}

// UpdateFolder saves changes to an existing folder.
func (f *folderStore) UpdateFolder(ctx context.Context, folder model.Folder) (model.Folder, error) {
	if err := f.storage.DB.WithContext(ctx).Save(&folder).Error; err != nil {
		return model.Folder{}, siloErrors.ErrGenericErr
	}
	return folder, nil
}

// DeleteFolder removes a folder. Assets inside it have their folder_id set to NULL
// automatically via the ON DELETE SET NULL foreign key constraint.
func (f *folderStore) DeleteFolder(ctx context.Context, id uuid.UUID) error {
	result := f.storage.DB.WithContext(ctx).Where("id = ?", id).Delete(&model.Folder{})
	if result.Error != nil {
		return siloErrors.ErrGenericErr
	}
	if result.RowsAffected == 0 {
		return siloErrors.ErrFolderNotFound
	}
	return nil
}

// MaxPosition returns the highest position value among folders of a given type in a portfolio.
func (f *folderStore) MaxPosition(ctx context.Context, portfolioID uuid.UUID, folderType model.FolderType) (int, error) {
	var max int
	err := f.storage.DB.WithContext(ctx).
		Model(&model.Folder{}).
		Select("COALESCE(MAX(position), -1)").
		Where("portfolio_id = ? AND folder_type = ?", portfolioID, folderType).
		Scan(&max).Error
	return max, err
}

// ReorderFolders applies a batch position update inside a single transaction.
func (f *folderStore) ReorderFolders(ctx context.Context, portfolioID uuid.UUID, positions []model.FolderPosition) error {
	return f.storage.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, p := range positions {
			result := tx.Model(&model.Folder{}).
				Where("id = ? AND portfolio_id = ?", p.ID, portfolioID).
				UpdateColumn("position", p.Position)
			if result.Error != nil {
				return siloErrors.ErrGenericErr
			}
			if result.RowsAffected == 0 {
				return siloErrors.ErrFolderNotFound
			}
		}
		return nil
	})
}
