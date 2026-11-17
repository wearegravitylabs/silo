// Package vault implements secure document storage.
//
// A portfolio's vault has one password, set by an owner. Files are encrypted
// in the browser with a random vault key before upload; the server stores
// only ciphertext, the vault key wrapped with a password-derived key, and the
// hash of a password-derived verifier. It never sees the password or the
// vault key, so a forgotten password can't be recovered.
package vault

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/app/confirm"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

//go:generate mockgen -source vault.go -destination ../mock/vault/mock_vault.go -package vault Vault

const (
	presignExpiry = 1 * time.Hour
	// MaxUnlockTries wrong passwords in a row block unlocking for UnlockLockout.
	MaxUnlockTries = 5
	UnlockLockout  = 15 * time.Minute
)

// Vault defines secure document management operations. Access to the
// portfolio's vault section is checked by the routes.
type Vault interface {
	// Upload stores a file and its metadata. encryption describes how the
	// browser encrypted it (nil for a plain file).
	Upload(ctx context.Context, userID, portfolioID uuid.UUID, fileName, fileType string, data io.Reader, size int64, encryption model.JSONB) (model.VaultDocument, error)
	// ReplaceFile swaps a document's file, e.g. for its encrypted version.
	ReplaceFile(ctx context.Context, documentID uuid.UUID, fileType string, data io.Reader, size int64, encryption model.JSONB) (model.VaultDocument, error)
	// ListDocuments returns the portfolio's vault documents.
	ListDocuments(ctx context.Context, portfolioID uuid.UUID) ([]model.VaultDocument, error)
	// PresignedDownloadURL returns a short-lived URL for a vault document.
	PresignedDownloadURL(ctx context.Context, documentID uuid.UUID) (string, error)
	// Delete removes a vault document from storage and soft-deletes the DB record.
	Delete(ctx context.Context, documentID uuid.UUID) error

	// Status is what the browser needs before unlocking.
	Status(ctx context.Context, portfolioID, userID uuid.UUID) (model.VaultStatus, error)
	// SetPassword stores the first password (owner only, checked by the route).
	SetPassword(ctx context.Context, portfolioID, userID uuid.UUID, req model.SetVaultPasswordRequest) error
	// Unlock checks the verifier and returns the wrapped key.
	Unlock(ctx context.Context, portfolioID, userID uuid.UUID, verifier string) (model.UnlockVaultResponse, error)
	// ChangePassword swaps in the vault key wrapped with a new password,
	// after the old password and the emailed code check out.
	ChangePassword(ctx context.Context, portfolioID, userID uuid.UUID, req model.ChangeVaultPasswordRequest) error
}

type service struct{ dp app.Dependency }

// New returns a Vault service.
func New(dp app.Dependency) Vault { return &service{dp: dp} }

// ─── Documents ───────────────────────────────────────────────────────────────

func (s *service) Upload(ctx context.Context, userID, portfolioID uuid.UUID, fileName, fileType string, data io.Reader, size int64, encryption model.JSONB) (model.VaultDocument, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "vault.Upload").
		Str("portfolio_id", portfolioID.String()).
		Logger()

	key := buildKey(portfolioID, userID, fileName)
	if _, err := s.dp.ObjectStorage.Upload(ctx, s.dp.StoragePrivateBucket, key, data, size, storedType(fileType, encryption)); err != nil {
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
		Encrypted:   encryption != nil,
		Encryption:  encryption,
		UploadedAt:  time.Now().UTC(),
	}
	created, err := s.dp.VaultStore.CreateDocument(ctx, doc)
	if err != nil {
		log.Error().Err(err).Msg("failed to persist vault document metadata")
		_ = s.dp.ObjectStorage.Delete(ctx, s.dp.StoragePrivateBucket, key)
		return model.VaultDocument{}, err
	}
	return created, nil
}

func (s *service) ReplaceFile(ctx context.Context, documentID uuid.UUID, fileType string, data io.Reader, size int64, encryption model.JSONB) (model.VaultDocument, error) {
	log := siloLogger.FromCtx(ctx).With().Str(siloLogger.LogStrKeyMethod, "vault.ReplaceFile").Logger()

	doc, err := s.dp.VaultStore.GetDocumentByID(ctx, documentID)
	if err != nil {
		return model.VaultDocument{}, err
	}
	oldPath := doc.StoragePath
	doc.StoragePath = buildKey(doc.PortfolioID, doc.UserID, doc.FileName)
	if fileType != "" {
		doc.FileType = fileType
	}
	doc.FileSize, doc.Encrypted, doc.Encryption = size, encryption != nil, encryption

	if _, err := s.dp.ObjectStorage.Upload(ctx, s.dp.StoragePrivateBucket, doc.StoragePath, data, size, storedType(doc.FileType, encryption)); err != nil {
		log.Error().Err(err).Msg("failed to upload replacement file")
		return model.VaultDocument{}, siloErrors.ErrStorageUploadFailed
	}
	if err := s.dp.VaultStore.ReplaceFile(ctx, doc); err != nil {
		_ = s.dp.ObjectStorage.Delete(ctx, s.dp.StoragePrivateBucket, doc.StoragePath)
		return model.VaultDocument{}, err
	}
	if err := s.dp.ObjectStorage.Delete(ctx, s.dp.StoragePrivateBucket, oldPath); err != nil {
		log.Warn().Err(err).Msg("failed to delete the replaced file")
	}
	return doc, nil
}

func (s *service) ListDocuments(ctx context.Context, portfolioID uuid.UUID) ([]model.VaultDocument, error) {
	return s.dp.VaultStore.ListByPortfolio(ctx, portfolioID)
}

func (s *service) PresignedDownloadURL(ctx context.Context, documentID uuid.UUID) (string, error) {
	doc, err := s.dp.VaultStore.GetDocumentByID(ctx, documentID)
	if err != nil {
		return "", err
	}
	url, err := s.dp.ObjectStorage.PresignedURL(ctx, s.dp.StoragePrivateBucket, doc.StoragePath, presignExpiry)
	if err != nil {
		log := siloLogger.FromCtx(ctx)
		log.Error().Err(err).Msg("failed to generate presigned URL")
		return "", siloErrors.ErrStorageDownloadFailed
	}
	return url, nil
}

func (s *service) Delete(ctx context.Context, documentID uuid.UUID) error {
	doc, err := s.dp.VaultStore.GetDocumentByID(ctx, documentID)
	if err != nil {
		return err
	}
	if err := s.dp.ObjectStorage.Delete(ctx, s.dp.StoragePrivateBucket, doc.StoragePath); err != nil {
		log := siloLogger.FromCtx(ctx)
		log.Error().Err(err).Msg("failed to delete vault document from storage")
		return siloErrors.ErrStorageUploadFailed
	}
	return s.dp.VaultStore.SoftDeleteDocument(ctx, documentID)
}

// ─── Password ────────────────────────────────────────────────────────────────

func (s *service) Status(ctx context.Context, portfolioID, userID uuid.UUID) (model.VaultStatus, error) {
	st := model.VaultStatus{}
	if user, err := s.dp.UserStore.GetUserByID(ctx, userID); err == nil {
		if v, ok := user.Settings["vault"].(map[string]any); ok {
			if m, ok := v["auto_lock_minutes"].(float64); ok {
				st.AutoLockMinutes = int(m)
			}
		}
	}
	if until, err := s.dp.VaultStore.LockedUntil(ctx, portfolioID, userID); err == nil && until.After(time.Now()) {
		st.LockedUntil = &until
	}
	vault, err := s.dp.VaultStore.GetVault(ctx, portfolioID)
	if siloErrors.IsNotFound(err) {
		return st, nil
	}
	if err != nil {
		return model.VaultStatus{}, err
	}
	st.PasswordSet, st.Salt, st.KDF, st.KeyVersion = true, &vault.Salt, vault.KDF, vault.KeyVersion
	return st, nil
}

func (s *service) SetPassword(ctx context.Context, portfolioID, userID uuid.UUID, req model.SetVaultPasswordRequest) error {
	now := time.Now().UTC()
	err := s.dp.VaultStore.CreateVault(ctx, model.PortfolioVault{
		PortfolioID: portfolioID, WrappedKey: req.WrappedKey, Salt: req.Salt, KDF: req.KDF,
		VerifierHash: hashVerifier(req.Verifier), KeyVersion: 1, SetBy: &userID, CreatedAt: now, UpdatedAt: now,
	})
	if err == siloErrors.ErrDuplicateRecord {
		return siloErrors.ErrVaultPasswordSet
	}
	return err
}

func (s *service) Unlock(ctx context.Context, portfolioID, userID uuid.UUID, verifier string) (model.UnlockVaultResponse, error) {
	if until, err := s.dp.VaultStore.LockedUntil(ctx, portfolioID, userID); err == nil && until.After(time.Now()) {
		return model.UnlockVaultResponse{}, siloErrors.ErrVaultLocked
	}
	vault, err := s.dp.VaultStore.GetVault(ctx, portfolioID)
	if siloErrors.IsNotFound(err) {
		return model.UnlockVaultResponse{}, siloErrors.ErrVaultPasswordNotSet
	}
	if err != nil {
		return model.UnlockVaultResponse{}, err
	}
	if !sameHash(vault.VerifierHash, verifier) {
		until, err := s.dp.VaultStore.FailUnlock(ctx, portfolioID, userID, MaxUnlockTries, time.Now().UTC().Add(UnlockLockout))
		if err == nil && !until.IsZero() {
			return model.UnlockVaultResponse{}, siloErrors.ErrVaultLocked
		}
		return model.UnlockVaultResponse{}, siloErrors.ErrInvalidVaultPassword
	}
	_ = s.dp.VaultStore.ResetUnlock(ctx, portfolioID, userID)
	return model.UnlockVaultResponse{WrappedKey: vault.WrappedKey, KeyVersion: vault.KeyVersion}, nil
}

func (s *service) ChangePassword(ctx context.Context, portfolioID, userID uuid.UUID, req model.ChangeVaultPasswordRequest) error {
	vault, err := s.dp.VaultStore.GetVault(ctx, portfolioID)
	if siloErrors.IsNotFound(err) {
		return siloErrors.ErrVaultPasswordNotSet
	}
	if err != nil {
		return err
	}
	if !sameHash(vault.VerifierHash, req.OldVerifier) {
		return siloErrors.ErrInvalidVaultPassword
	}
	if err := confirm.Check(ctx, s.dp, userID, model.PurposeChangeVaultPassword, &portfolioID, req.Code); err != nil {
		return err
	}
	// Same vault key, wrapped with the new password: existing files stay readable.
	vault.WrappedKey, vault.Salt, vault.KDF = req.WrappedKey, req.Salt, req.KDF
	vault.VerifierHash, vault.SetBy, vault.UpdatedAt = hashVerifier(req.Verifier), &userID, time.Now().UTC()
	return s.dp.VaultStore.UpdateVault(ctx, vault)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func hashVerifier(v string) string {
	sum := sha256.Sum256([]byte(v))
	return hex.EncodeToString(sum[:])
}

func sameHash(stored, verifier string) bool {
	return subtle.ConstantTimeCompare([]byte(stored), []byte(hashVerifier(verifier))) == 1
}

// storedType is the content type an object is stored with: ciphertext is
// opaque bytes, whatever the original file was.
func storedType(fileType string, encryption model.JSONB) string {
	if encryption != nil {
		return "application/octet-stream"
	}
	return fileType
}

// buildKey constructs the private storage key:
// vault/{portfolioID}/{userID}/{uuid}-{safeFilename}
func buildKey(portfolioID, userID uuid.UUID, fileName string) string {
	safe := strings.NewReplacer("/", "_", "\\", "_", "..", "_").Replace(fileName)
	return fmt.Sprintf("vault/%s/%s/%s-%s",
		portfolioID.String(), userID.String(),
		uuid.New().String(), safe)
}
