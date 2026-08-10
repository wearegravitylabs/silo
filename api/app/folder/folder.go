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
// callerID flows through every method for audit logging and store-level scoping.
// Role checks (membership, editor/owner) are enforced by HTTP middleware before
// these methods are called.
type Folder interface {
	Create(ctx context.Context, portfolioID, callerID uuid.UUID, req model.CreateFolderRequest) (model.Folder, error)
	Get(ctx context.Context, folderID, callerID uuid.UUID) (model.Folder, error)
	// List returns folders of the given type ordered by position.
	List(ctx context.Context, portfolioID, callerID uuid.UUID, folderType model.FolderType) ([]model.Folder, error)
	Update(ctx context.Context, folderID, callerID uuid.UUID, req model.UpdateFolderRequest) (model.Folder, error)
	Delete(ctx context.Context, folderID, callerID uuid.UUID) error
	Reorder(ctx context.Context, portfolioID, callerID uuid.UUID, req model.ReorderFoldersRequest) error
}

type service struct{ dp app.Dependency }

// New returns a Folder service backed by the provided dependency container.
func New(dp app.Dependency) Folder { return &service{dp: dp} }

// Create adds a new folder positioned at max(existing of same type) + 1.
func (s *service) Create(ctx context.Context, portfolioID, callerID uuid.UUID, req model.CreateFolderRequest) (model.Folder, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "folder.Create").
		Str("portfolio_id", portfolioID.String()).
		Str("caller_id", callerID.String()).
		Logger()

	maxPos, err := s.dp.FolderStore.MaxPosition(ctx, portfolioID, req.FolderType)
	if err != nil {
		log.Error().Err(err).Msg("failed to get max folder position")
		return model.Folder{}, err
	}

	folder := model.Folder{
		PortfolioID: portfolioID,
		FolderType:  req.FolderType,
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
func (s *service) Get(ctx context.Context, folderID, callerID uuid.UUID) (model.Folder, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "folder.Get").
		Str("folder_id", folderID.String()).
		Logger()

	folder, err := s.dp.FolderStore.GetFolderByID(ctx, folderID)
	if err != nil {
		log.Error().Err(err).Msg("failed to get folder")
		return model.Folder{}, err
	}
	return folder, nil
}

// List returns folders of the given type for the portfolio ordered by position.
func (s *service) List(ctx context.Context, portfolioID, callerID uuid.UUID, folderType model.FolderType) ([]model.Folder, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "folder.List").
		Str("portfolio_id", portfolioID.String()).
		Logger()

	folders, err := s.dp.FolderStore.ListFoldersByPortfolio(ctx, portfolioID, folderType)
	if err != nil {
		log.Error().Err(err).Msg("failed to list folders")
		return nil, err
	}
	return folders, nil
}

// Update applies name, icon, or image changes to an existing folder.
func (s *service) Update(ctx context.Context, folderID, callerID uuid.UUID, req model.UpdateFolderRequest) (model.Folder, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "folder.Update").
		Str("folder_id", folderID.String()).
		Str("caller_id", callerID.String()).
		Logger()

	folder, err := s.dp.FolderStore.GetFolderByID(ctx, folderID)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch folder for update")
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
func (s *service) Delete(ctx context.Context, folderID, callerID uuid.UUID) error {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "folder.Delete").
		Str("folder_id", folderID.String()).
		Str("caller_id", callerID.String()).
		Logger()

	if err := s.dp.FolderStore.DeleteFolder(ctx, folderID); err != nil {
		log.Error().Err(err).Msg("failed to delete folder")
		return err
	}

	log.Info().Msg("folder deleted")
	return nil
}

// Reorder applies the new ordering atomically.
func (s *service) Reorder(ctx context.Context, portfolioID, callerID uuid.UUID, req model.ReorderFoldersRequest) error {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "folder.Reorder").
		Str("portfolio_id", portfolioID.String()).
		Logger()

	if err := s.dp.FolderStore.ReorderFolders(ctx, portfolioID, req.Folders); err != nil {
		log.Error().Err(err).Msg("failed to reorder folders")
		return err
	}
	return nil
}
