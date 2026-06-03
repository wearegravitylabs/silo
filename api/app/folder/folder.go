// Package folder implements folder management for organising portfolio assets.
package folder

import (
	"context"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/model"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

//go:generate mockgen -source folder.go -destination ../mock/folder/mock_folder.go -package folder Folder

// Folder defines folder lifecycle operations.
// Permission checks (portfolio membership and role) are enforced at the HTTP
// layer via middleware — this service contains only business logic.
type Folder interface {
	// Create adds a new folder to the portfolio, positioned after existing ones.
	Create(ctx context.Context, portfolioID uuid.UUID, req model.CreateFolderRequest) (model.Folder, error)
	// Get fetches a single folder by ID.
	Get(ctx context.Context, folderID uuid.UUID) (model.Folder, error)
	// List returns all folders for a portfolio ordered by position ascending.
	List(ctx context.Context, portfolioID uuid.UUID) ([]model.Folder, error)
	// Update renames or changes the icon/image of a folder.
	Update(ctx context.Context, folderID uuid.UUID, req model.UpdateFolderRequest) (model.Folder, error)
	// Delete removes the folder. Assets inside become folder-less (folder_id = NULL via FK).
	Delete(ctx context.Context, folderID uuid.UUID) error
	// Reorder applies a new position ordering to all folders in the portfolio atomically.
	Reorder(ctx context.Context, portfolioID uuid.UUID, req model.ReorderFoldersRequest) error
}

type service struct{ dp app.Dependency }

// New returns a Folder service backed by the provided dependency container.
func New(dp app.Dependency) Folder { return &service{dp: dp} }

// Create adds a new folder positioned at max(existing) + 1.
func (s *service) Create(ctx context.Context, portfolioID uuid.UUID, req model.CreateFolderRequest) (model.Folder, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "folder.Create").
		Logger()

	maxPos, err := s.dp.FolderStore.MaxPosition(ctx, portfolioID)
	if err != nil {
		log.Error().Err(err).Msg("failed to get max folder position")
		return model.Folder{}, err
	}

	folder := model.Folder{
		PortfolioID: portfolioID,
		Name:        req.Name,
		Icon:        req.Icon,
		ImageURL:    req.ImageURL,
		Position:    maxPos + 1,
	}

	created, err := s.dp.FolderStore.CreateFolder(ctx, folder)
	if err != nil {
		log.Error().Err(err).Msg("failed to create folder")
		return model.Folder{}, err
	}

	log.Info().Str("folder_id", created.ID.String()).Msg("folder created")
	return created, nil
}

// Get fetches a single folder by ID.
func (s *service) Get(ctx context.Context, folderID uuid.UUID) (model.Folder, error) {
	return s.dp.FolderStore.GetFolderByID(ctx, folderID)
}

// List returns folders for the portfolio ordered by position.
func (s *service) List(ctx context.Context, portfolioID uuid.UUID) ([]model.Folder, error) {
	return s.dp.FolderStore.ListFoldersByPortfolio(ctx, portfolioID)
}

// Update applies name, icon, or image changes to an existing folder.
func (s *service) Update(ctx context.Context, folderID uuid.UUID, req model.UpdateFolderRequest) (model.Folder, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "folder.Update").
		Logger()

	folder, err := s.dp.FolderStore.GetFolderByID(ctx, folderID)
	if err != nil {
		return model.Folder{}, err
	}

	if req.Name != nil {
		folder.Name = *req.Name
	}
	if req.Icon != nil {
		folder.Icon = req.Icon
	}
	if req.ImageURL != nil {
		folder.ImageURL = req.ImageURL
	}

	updated, err := s.dp.FolderStore.UpdateFolder(ctx, folder)
	if err != nil {
		log.Error().Err(err).Msg("failed to update folder")
		return model.Folder{}, err
	}
	return updated, nil
}

// Delete removes a folder. Assets inside become folder-less via the DB FK constraint.
func (s *service) Delete(ctx context.Context, folderID uuid.UUID) error {
	return s.dp.FolderStore.DeleteFolder(ctx, folderID)
}

// Reorder applies the new ordering atomically.
func (s *service) Reorder(ctx context.Context, portfolioID uuid.UUID, req model.ReorderFoldersRequest) error {
	return s.dp.FolderStore.ReorderFolders(ctx, portfolioID, req.Folders)
}
