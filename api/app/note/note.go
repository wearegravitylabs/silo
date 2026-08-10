// Package note implements shared note management for any entity that
// can have text notes attached (assets, debts, and any future entity types).
package note

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

//go:generate mockgen -source note.go -destination ../mock/note/mock_note.go -package note Note

// Note defines note management operations shared across entity types.
type Note interface {
	// AddToAsset creates a note attached to an asset.
	AddToAsset(ctx context.Context, assetID, callerID uuid.UUID, portfolioID uuid.UUID, req model.CreateNoteRequest) (model.AssetNote, error)
	// AddToDebt creates a note attached to a debt.
	AddToDebt(ctx context.Context, debtID, callerID uuid.UUID, portfolioID uuid.UUID, req model.CreateNoteRequest) (model.AssetNote, error)
	// Update edits the title and/or content of an existing note.
	Update(ctx context.Context, noteID uuid.UUID, req model.UpdateNoteRequest) (model.AssetNote, error)
	// ListByAsset returns all non-deleted notes for an asset.
	ListByAsset(ctx context.Context, assetID uuid.UUID) ([]model.AssetNote, error)
	// ListByDebt returns all non-deleted notes for a debt.
	ListByDebt(ctx context.Context, debtID uuid.UUID) ([]model.AssetNote, error)
	// Delete soft-deletes a note.
	Delete(ctx context.Context, noteID uuid.UUID) error
}

type service struct{ dp app.Dependency }

// New returns a Note service.
func New(dp app.Dependency) Note { return &service{dp: dp} }

// AddToAsset creates a note and attaches it to an asset.
func (s *service) AddToAsset(ctx context.Context, assetID, callerID uuid.UUID, portfolioID uuid.UUID, req model.CreateNoteRequest) (model.AssetNote, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "note.AddToAsset").
		Str("asset_id", assetID.String()).
		Logger()

	now := time.Now().UTC()
	note := model.AssetNote{
		AssetID:     &assetID,
		PortfolioID: portfolioID,
		Title:       req.Title,
		Content:     req.Content,
		Tags:        req.Tags,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	created, err := s.dp.AssetNoteStore.CreateNote(ctx, note)
	if err != nil {
		log.Error().Err(err).Msg("failed to create note for asset")
		return model.AssetNote{}, err
	}

	log.Info().Str("note_id", created.ID.String()).Msg("note added to asset")
	return created, nil
}

// AddToDebt creates a note and attaches it to a debt.
func (s *service) AddToDebt(ctx context.Context, debtID, callerID uuid.UUID, portfolioID uuid.UUID, req model.CreateNoteRequest) (model.AssetNote, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "note.AddToDebt").
		Str("debt_id", debtID.String()).
		Logger()

	now := time.Now().UTC()
	note := model.AssetNote{
		DebtID:      &debtID,
		PortfolioID: portfolioID,
		Title:       req.Title,
		Content:     req.Content,
		Tags:        req.Tags,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	created, err := s.dp.AssetNoteStore.CreateNote(ctx, note)
	if err != nil {
		log.Error().Err(err).Msg("failed to create note for debt")
		return model.AssetNote{}, err
	}

	log.Info().Str("note_id", created.ID.String()).Msg("note added to debt")
	return created, nil
}

// Update edits an existing note's title and/or content.
func (s *service) Update(ctx context.Context, noteID uuid.UUID, req model.UpdateNoteRequest) (model.AssetNote, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "note.Update").
		Str("note_id", noteID.String()).
		Logger()

	existing, err := s.dp.AssetNoteStore.GetNoteByID(ctx, noteID)
	if err != nil {
		log.Error().Err(err).Msg("note not found")
		return model.AssetNote{}, siloErrors.ErrRecordNotFound
	}

	// Apply only the fields that were provided.
	title := existing.Title
	content := existing.Content
	tags := existing.Tags
	if req.Title != nil {
		title = *req.Title
	}
	if req.Content != nil {
		content = *req.Content
	}
	if req.Tags != nil {
		tags = req.Tags
	}

	updated, err := s.dp.AssetNoteStore.UpdateNote(ctx, noteID, title, content, tags)
	if err != nil {
		log.Error().Err(err).Msg("failed to update note")
		return model.AssetNote{}, err
	}

	log.Info().Msg("note updated")
	return updated, nil
}

// ListByAsset returns all non-deleted notes for an asset.
func (s *service) ListByAsset(ctx context.Context, assetID uuid.UUID) ([]model.AssetNote, error) {
	return s.dp.AssetNoteStore.ListByAsset(ctx, assetID)
}

// ListByDebt returns all non-deleted notes for a debt.
func (s *service) ListByDebt(ctx context.Context, debtID uuid.UUID) ([]model.AssetNote, error) {
	return s.dp.AssetNoteStore.ListByDebt(ctx, debtID)
}

// Delete soft-deletes a note by ID.
func (s *service) Delete(ctx context.Context, noteID uuid.UUID) error {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "note.Delete").
		Str("note_id", noteID.String()).
		Logger()

	if err := s.dp.AssetNoteStore.SoftDeleteNote(ctx, noteID); err != nil {
		log.Error().Err(err).Msg("failed to delete note")
		return err
	}

	log.Info().Msg("note deleted")
	return nil
}
