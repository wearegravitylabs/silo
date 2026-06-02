// Package vault implements secure document storage.
// The vault stores client-side encrypted blobs — the server never sees plaintext.
package vault

import (
	"context"
	"io"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source vault.go -destination ../mock/vault/mock_vault.go -package vault Vault

// Vault defines secure document management operations.
type Vault interface {
	// Upload stores a client-side-encrypted blob in object storage and records metadata.
	Upload(ctx context.Context, userID, portfolioID uuid.UUID, fileName, fileType string, data io.Reader, size int64) (model.VaultDocument, error)
	// ListDocuments returns vault document metadata for the user.
	ListDocuments(ctx context.Context, userID, portfolioID uuid.UUID) ([]model.VaultDocument, error)
	// PresignedDownloadURL returns a short-lived URL for a vault document.
	PresignedDownloadURL(ctx context.Context, userID uuid.UUID, documentID uuid.UUID) (string, error)
	// Delete removes a vault document.
	Delete(ctx context.Context, userID uuid.UUID, documentID uuid.UUID) error
}

type service struct{ dp app.Dependency }

// New returns a Vault service.
func New(dp app.Dependency) Vault { return &service{dp: dp} }

func (s *service) Upload(ctx context.Context, userID, portfolioID uuid.UUID, fileName, fileType string, data io.Reader, size int64) (model.VaultDocument, error) {
	panic("not implemented")
}

func (s *service) ListDocuments(ctx context.Context, userID, portfolioID uuid.UUID) ([]model.VaultDocument, error) {
	panic("not implemented")
}

func (s *service) PresignedDownloadURL(ctx context.Context, userID uuid.UUID, documentID uuid.UUID) (string, error) {
	panic("not implemented")
}

func (s *service) Delete(ctx context.Context, userID uuid.UUID, documentID uuid.UUID) error {
	panic("not implemented")
}
