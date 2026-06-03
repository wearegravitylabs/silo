// Package folder implements folder management for organising portfolio assets.
package folder

import (
	"context"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

//go:generate mockgen -source folder.go -destination ../mock/folder/mock_folder.go -package folder Folder

// Folder defines folder lifecycle operations.
// Every mutating method requires the caller's user ID so that portfolio
// membership and role can be verified before the operation is performed.
type Folder interface {
	// Create adds a new folder to the portfolio.
	// Caller must be Owner or Editor on the portfolio.
	Create(ctx context.Context, portfolioID, callerID uuid.UUID, req model.CreateFolderRequest) (model.Folder, error)
	// Get fetches a single folder. Caller must be a member of the portfolio.
	Get(ctx context.Context, folderID, callerID uuid.UUID) (model.Folder, error)
	// List returns all folders for a portfolio ordered by position ascending.
	// Caller must be a member of the portfolio.
	List(ctx context.Context, portfolioID, callerID uuid.UUID) ([]model.Folder, error)
	// Update renames or changes the icon/image of a folder.
	// Caller must be Owner or Editor.
	Update(ctx context.Context, folderID, callerID uuid.UUID, req model.UpdateFolderRequest) (model.Folder, error)
	// Delete removes the folder; assets inside become folder-less (folder_id = NULL).
	// Caller must be Owner or Editor.
	Delete(ctx context.Context, folderID, callerID uuid.UUID) error
	// Reorder applies a new position ordering to all folders in the portfolio.
	// Caller must be Owner or Editor.
	Reorder(ctx context.Context, portfolioID, callerID uuid.UUID, req model.ReorderFoldersRequest) error
}

type service struct{ dp app.Dependency }

// New returns a Folder service backed by the provided dependency container.
func New(dp app.Dependency) Folder { return &service{dp: dp} }

// ─── Permission helpers ───────────────────────────────────────────────────────

// requireEditor returns ErrInsufficientPermission when the caller is not at
// least an Editor (Owner or Editor) on the given portfolio.
func (s *service) requireEditor(ctx context.Context, portfolioID, callerID uuid.UUID) error {
	member, err := s.dp.PortfolioStore.GetMember(ctx, portfolioID, callerID)
	if err != nil {
		return siloErrors.ErrInsufficientPermission
	}
	allowed := map[model.PortfolioMemberRole]bool{
		model.RoleOwner:  true,
		model.RoleEditor: true,
	}
	if !allowed[member.Role] {
		return siloErrors.ErrInsufficientPermission
	}
	return nil
}

// requireMember returns ErrInsufficientPermission when the caller is not a
// member (any role) of the given portfolio.
func (s *service) requireMember(ctx context.Context, portfolioID, callerID uuid.UUID) error {
	_, err := s.dp.PortfolioStore.GetMember(ctx, portfolioID, callerID)
	if err != nil {
		return siloErrors.ErrInsufficientPermission
	}
	return nil
}

// ─── Service methods ──────────────────────────────────────────────────────────

// Create adds a new folder at the end of the current ordering.
// Caller must be Owner or Editor on the portfolio.
func (s *service) Create(ctx context.Context, portfolioID, callerID uuid.UUID, req model.CreateFolderRequest) (model.Folder, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "folder.Create").
		Logger()

	if err := s.requireEditor(ctx, portfolioID, callerID); err != nil {
		return model.Folder{}, err
	}

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

// Get fetches a single folder by ID after verifying portfolio membership.
func (s *service) Get(ctx context.Context, folderID, callerID uuid.UUID) (model.Folder, error) {
	folder, err := s.dp.FolderStore.GetFolderByID(ctx, folderID)
	if err != nil {
		return model.Folder{}, err
	}
	if err := s.requireMember(ctx, folder.PortfolioID, callerID); err != nil {
		return model.Folder{}, err
	}
	return folder, nil
}

// List returns folders for the portfolio ordered by position.
// Caller must be a member of the portfolio.
func (s *service) List(ctx context.Context, portfolioID, callerID uuid.UUID) ([]model.Folder, error) {
	if err := s.requireMember(ctx, portfolioID, callerID); err != nil {
		return nil, err
	}
	return s.dp.FolderStore.ListFoldersByPortfolio(ctx, portfolioID)
}

// Update applies name, icon, or image changes to a folder.
// Caller must be Owner or Editor on the portfolio.
func (s *service) Update(ctx context.Context, folderID, callerID uuid.UUID, req model.UpdateFolderRequest) (model.Folder, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "folder.Update").
		Logger()

	folder, err := s.dp.FolderStore.GetFolderByID(ctx, folderID)
	if err != nil {
		return model.Folder{}, err
	}
	if err := s.requireEditor(ctx, folder.PortfolioID, callerID); err != nil {
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

// Delete removes a folder; assets inside become folder-less automatically.
// Caller must be Owner or Editor on the portfolio.
func (s *service) Delete(ctx context.Context, folderID, callerID uuid.UUID) error {
	folder, err := s.dp.FolderStore.GetFolderByID(ctx, folderID)
	if err != nil {
		return err
	}
	if err := s.requireEditor(ctx, folder.PortfolioID, callerID); err != nil {
		return err
	}
	return s.dp.FolderStore.DeleteFolder(ctx, folderID)
}

// Reorder applies the caller's new ordering to all listed folders atomically.
// Caller must be Owner or Editor on the portfolio.
func (s *service) Reorder(ctx context.Context, portfolioID, callerID uuid.UUID, req model.ReorderFoldersRequest) error {
	if err := s.requireEditor(ctx, portfolioID, callerID); err != nil {
		return err
	}
	return s.dp.FolderStore.ReorderFolders(ctx, portfolioID, req.Folders)
}
