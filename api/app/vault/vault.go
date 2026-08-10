// Package vault implements secure document storage.
// The vault stores client-side encrypted blobs — the server never sees plaintext.
package vault

import (
	"context"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

//go:generate mockgen -source vault.go -destination ../mock/vault/mock_vault.go -package vault Vault

const presignExpiry = 1 * time.Hour

// Vault defines secure document management operations.
type Vault interface {
	// Upload stores a client-side-encrypted blob in object storage and records metadata.
	Upload(ctx context.Context, userID, portfolioID uuid.UUID, fileName, fileType string, data io.Reader, size int64) (model.VaultDocument, error)
	// ListDocuments returns vault document metadata for the user within a portfolio.
	ListDocuments(ctx context.Context, userID, portfolioID uuid.UUID) ([]model.VaultDocument, error)
	// PresignedDownloadURL returns a short-lived URL for a vault document.
	PresignedDownloadURL(ctx context.Context, userID uuid.UUID, documentID uuid.UUID) (string, error)
	// Delete removes a vault document from storage and soft-deletes the DB record.
	Delete(ctx context.Context, userID uuid.UUID, documentID uuid.UUID) error
}

type service struct{ dp app.Dependency }

// New returns a Vault service.
func New(dp app.Dependency) Vault { return &service{dp: dp} }

// Upload stores a file in the private bucket and persists its metadata.
func (s *service) Upload(ctx context.Context, userID, portfolioID uuid.UUID, fileName, fileType string, data io.Reader, size int64) (model.VaultDocument, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "vault.Upload").
		Str("user_id", userID.String()).
		Str("portfolio_id", portfolioID.String()).
		Logger()

	key := buildKey(portfolioID, userID, fileName)

	if _, err := s.dp.ObjectStorage.Upload(ctx, s.dp.StoragePrivateBucket, key, data, size); err != nil {
		log.Error().Err(err).Msg("failed to upload vault document")
		return model.VaultDocument{}, siloErrors.ErrStorageUploadFailed
	}

	doc := model.VaultDocument{
		UserID:      userID,
		PortfolioID: portfolioID,
		FileName:    fileName,
		FileType:    fileType,
		StoragePath: key,
		FileSize:    size,
		UploadedAt:  time.Now().UTC(),
	}

	created, err := s.dp.VaultStore.CreateDocument(ctx, doc)
	if err != nil {
		log.Error().Err(err).Msg("failed to persist vault document metadata")
		_ = s.dp.ObjectStorage.Delete(ctx, s.dp.StoragePrivateBucket, key)
		return model.VaultDocument{}, err
	}

	log.Info().Str("doc_id", created.ID.String()).Msg("vault document uploaded")
	return created, nil
}

// ListDocuments returns all non-deleted vault documents for a user within a portfolio.
func (s *service) ListDocuments(ctx context.Context, userID, portfolioID uuid.UUID) ([]model.VaultDocument, error) {
	return s.dp.VaultStore.ListByPortfolio(ctx, userID, portfolioID)
}

// PresignedDownloadURL generates a presigned URL valid for 1 hour.
// Returns ErrUnauthorized if the document doesn't belong to the caller.
func (s *service) PresignedDownloadURL(ctx context.Context, userID uuid.UUID, documentID uuid.UUID) (string, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "vault.PresignedDownloadURL").
		Str("doc_id", documentID.String()).
		Logger()

	doc, err := s.dp.VaultStore.GetDocumentByID(ctx, documentID)
	if err != nil {
		return "", err
	}

	if doc.UserID != userID {
		log.Warn().Msg("vault download attempted by non-owner")
		return "", siloErrors.ErrUnauthorized
	}

	url, err := s.dp.ObjectStorage.PresignedURL(ctx, s.dp.StoragePrivateBucket, doc.StoragePath, presignExpiry)
	if err != nil {
		log.Error().Err(err).Msg("failed to generate presigned URL")
		return "", siloErrors.ErrStorageDownloadFailed
	}

	return url, nil
}

// Delete removes the file from storage and soft-deletes the DB record.
// Returns ErrUnauthorized if the document doesn't belong to the caller.
func (s *service) Delete(ctx context.Context, userID uuid.UUID, documentID uuid.UUID) error {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "vault.Delete").
		Str("doc_id", documentID.String()).
		Logger()

	doc, err := s.dp.VaultStore.GetDocumentByID(ctx, documentID)
	if err != nil {
		return err
	}

	if doc.UserID != userID {
		log.Warn().Msg("vault delete attempted by non-owner")
		return siloErrors.ErrUnauthorized
	}

	if err := s.dp.ObjectStorage.Delete(ctx, s.dp.StoragePrivateBucket, doc.StoragePath); err != nil {
		log.Error().Err(err).Msg("failed to delete vault document from storage")
		return siloErrors.ErrStorageUploadFailed
	}

	if err := s.dp.VaultStore.SoftDeleteDocument(ctx, documentID); err != nil {
		log.Error().Err(err).Msg("failed to soft-delete vault document record")
		return err
	}

	log.Info().Msg("vault document deleted")
	return nil
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// buildKey constructs the private storage key:
// vault/{portfolioID}/{userID}/{uuid}-{safeFilename}
func buildKey(portfolioID, userID uuid.UUID, fileName string) string {
	safe := strings.NewReplacer("/", "_", "\\", "_", "..", "_").Replace(fileName)
	return fmt.Sprintf("vault/%s/%s/%s-%s",
		portfolioID.String(), userID.String(),
		uuid.New().String(), safe)
}
