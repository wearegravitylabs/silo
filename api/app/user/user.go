// Package user implements user profile management.
package user

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	"github.com/wearegravitylabs/silo/api/app/confirm"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	modelEnv "github.com/wearegravitylabs/silo/api/model/env"
	"github.com/wearegravitylabs/silo/api/pkg/crypto"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
	messagingModel "github.com/wearegravitylabs/silo/api/thirdparty/messaging/model"
	"github.com/wearegravitylabs/silo/api/thirdparty/messaging/templates"
)

//go:generate mockgen -source user.go -destination ../mock/user/mock_user.go -package user User

// User defines user profile operations.
type User interface {
	// GetByID returns the user profile for the given ID.
	GetByID(ctx context.Context, id uuid.UUID) (model.User, error)
	// UpdateProfile applies partial profile changes. Only non-nil fields are updated.
	UpdateProfile(ctx context.Context, id uuid.UUID, req model.UpdateProfileRequest) (model.User, error)
	// DeleteAccount soft-deletes the user's account. code is the one emailed
	// by SendConfirmationCode for delete_account.
	DeleteAccount(ctx context.Context, id uuid.UUID, code string) error
	// SendConfirmationCode emails a code that confirms a risky action.
	SendConfirmationCode(ctx context.Context, id uuid.UUID, req model.SendConfirmationCodeRequest) error
	// RequestEmailChange emails a confirm link to the new address.
	RequestEmailChange(ctx context.Context, id uuid.UUID, newEmail string) error
	// ConfirmEmailChange completes a change from the link's token.
	ConfirmEmailChange(ctx context.Context, token string) (model.User, error)
	// EmailAvailable reports whether no other account uses the address.
	EmailAvailable(ctx context.Context, id uuid.UUID, email string) (model.EmailAvailability, error)
	// PurgeDeletedAccounts permanently removes accounts and portfolios deleted
	// more than DeletedRetention ago, files included. It is a daily scheduler job.
	PurgeDeletedAccounts(ctx context.Context) error
	// Onboard completes the onboarding flow: sets first/last name + phone, marks is_onboarded = true.
	// Returns ErrAlreadyOnboarded when is_onboarded is already true.
	Onboard(ctx context.Context, id uuid.UUID, req model.OnboardRequest) (model.User, error)
}

type service struct{ dp app.Dependency }

// New returns a User service.
func New(dp app.Dependency) User { return &service{dp: dp} }

// GetByID returns the user profile.
func (s *service) GetByID(ctx context.Context, id uuid.UUID) (model.User, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "user.GetByID").
		Str("user_id", id.String()).
		Logger()

	user, err := s.dp.UserStore.GetUserByID(ctx, id)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch user")
		return model.User{}, err
	}
	return user, nil
}

// UpdateProfile applies a partial update to the user's profile.
func (s *service) UpdateProfile(ctx context.Context, id uuid.UUID, req model.UpdateProfileRequest) (model.User, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "user.UpdateProfile").
		Str("user_id", id.String()).
		Logger()

	user, err := s.dp.UserStore.GetUserByID(ctx, id)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch user for profile update")
		return model.User{}, err
	}

	if req.FirstName != nil {
		user.FirstName = *req.FirstName
	}
	if req.LastName != nil {
		user.LastName = *req.LastName
	}
	if req.PhoneNumber != nil {
		user.PhoneNumber = req.PhoneNumber
	}
	if req.PhoneCountryCode != nil {
		user.PhoneCountryCode = req.PhoneCountryCode
	}
	oldAvatar := user.AvatarURL
	if req.AvatarURL.Set {
		user.AvatarURL = req.AvatarURL.Value
	}
	if req.DateOfBirth.Set {
		if req.DateOfBirth.Value != nil && req.DateOfBirth.Value.Time().After(time.Now()) {
			return model.User{}, siloErrors.ErrDateInFuture
		}
		user.DateOfBirth = req.DateOfBirth.Value
	}
	if req.Settings != nil {
		merged, err := mergeSettings(user.Settings, req.Settings)
		if err != nil {
			return model.User{}, err
		}
		user.Settings = merged
	}

	updated, err := s.dp.UserStore.UpdateUser(ctx, user)
	if err != nil {
		log.Error().Err(err).Msg("failed to save profile update")
		return model.User{}, err
	}

	// A replaced or removed photo is deleted from storage.
	if oldAvatar != nil && (user.AvatarURL == nil || *user.AvatarURL != *oldAvatar) {
		s.deleteUploadedFile(ctx, id, *oldAvatar)
	}

	log.Info().Msg("profile updated")
	return updated, nil
}

// SendConfirmationCode emails a code for deleting the account or a portfolio
// the caller owns.
func (s *service) SendConfirmationCode(ctx context.Context, id uuid.UUID, req model.SendConfirmationCodeRequest) error {
	user, err := s.dp.UserStore.GetUserByID(ctx, id)
	if err != nil {
		return err
	}
	var target *uuid.UUID
	if req.Purpose == model.PurposeDeletePortfolio {
		if req.PortfolioID == nil {
			return siloErrors.ErrInvalidRequest
		}
		member, err := s.dp.PortfolioStore.GetMember(ctx, *req.PortfolioID, id)
		if err != nil || member.Role != model.RoleOwner {
			return siloErrors.ErrInsufficientPermission
		}
		target = req.PortfolioID
	}
	return confirm.Send(ctx, s.dp, user, req.Purpose, target)
}

// DeleteAccount soft-deletes the user and the portfolios only they own (see
// store.DeleteAccount), then runs the OnAccountDeleted hooks. The data is kept
// for PurgeDeletedAccounts to remove for good after the retention period.
func (s *service) DeleteAccount(ctx context.Context, id uuid.UUID, code string) error {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "user.DeleteAccount").
		Str("user_id", id.String()).
		Logger()

	if err := confirm.Check(ctx, s.dp, id, model.PurposeDeleteAccount, nil, code); err != nil {
		return err
	}

	if err := s.dp.UserStore.DeleteAccount(ctx, id); err != nil {
		log.Error().Err(err).Msg("failed to delete account")
		return err
	}

	// Hooks clean up what the OSS tables don't know about (e.g. silo-cloud
	// cancels the subscription). The account is already gone, so a failing
	// hook is logged, not returned.
	for _, hook := range s.dp.OnAccountDeleted {
		if err := hook(context.WithoutCancel(ctx), id); err != nil {
			log.Error().Err(err).Msg("account-deleted hook failed")
		}
	}

	log.Info().Msg("account deleted")
	return nil
}

// EmailChangeExpiry is how long the confirm link for a new email works.
const EmailChangeExpiry = 24 * time.Hour

func (s *service) EmailAvailable(ctx context.Context, id uuid.UUID, email string) (model.EmailAvailability, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	other, err := s.dp.UserStore.GetUserByEmail(ctx, email)
	return model.EmailAvailability{Email: email, Available: err != nil || other.ID == id}, nil
}

// RequestEmailChange checks the new address is free and emails it a link.
// The change happens only when the link is opened (ConfirmEmailChange).
func (s *service) RequestEmailChange(ctx context.Context, id uuid.UUID, newEmail string) error {
	log := siloLogger.FromCtx(ctx).With().Str(siloLogger.LogStrKeyMethod, "user.RequestEmailChange").Logger()

	newEmail = strings.ToLower(strings.TrimSpace(newEmail))
	user, err := s.dp.UserStore.GetUserByID(ctx, id)
	if err != nil {
		return err
	}
	if newEmail == user.Email {
		return siloErrors.ErrInvalidRequest
	}
	if avail, _ := s.EmailAvailable(ctx, id, newEmail); !avail.Available {
		return siloErrors.ErrUserEmailExists
	}

	raw, err := crypto.GenerateRandomKey(32)
	if err != nil {
		return siloErrors.ErrGenericErr
	}
	sum := sha256.Sum256([]byte(raw))
	if err := s.dp.ConfirmationStore.CreateEmailChange(ctx, model.EmailChange{
		UserID: id, NewEmail: newEmail, TokenHash: hex.EncodeToString(sum[:]),
		ExpiresAt: time.Now().UTC().Add(EmailChangeExpiry), CreatedAt: time.Now().UTC(),
	}); err != nil {
		return err
	}
	link := strings.TrimRight(s.dp.Env.Get(modelEnv.AppBaseURL), "/") + "/confirm-email?token=" + raw
	if err := s.dp.EmailingService.SendEmail(ctx, messagingModel.EmailPayload{
		To:      newEmail,
		Subject: "Confirm your new Silo email",
		Body:    templates.ConfirmEmailChangeEmail(link, EmailChangeExpiry),
	}); err != nil {
		log.Error().Err(err).Msg("failed to send email change link")
		return siloErrors.ErrGenericErr
	}
	return nil
}

// ConfirmEmailChange switches the account to the new address and lets the
// old address know.
func (s *service) ConfirmEmailChange(ctx context.Context, token string) (model.User, error) {
	sum := sha256.Sum256([]byte(token))
	change, err := s.dp.ConfirmationStore.EmailChangeByToken(ctx, hex.EncodeToString(sum[:]))
	if err != nil {
		return model.User{}, siloErrors.ErrInvalidLink
	}
	user, err := s.dp.UserStore.GetUserByID(ctx, change.UserID)
	if err != nil {
		return model.User{}, siloErrors.ErrInvalidLink
	}
	// Someone may have signed up with the address since the link was sent.
	if avail, _ := s.EmailAvailable(ctx, user.ID, change.NewEmail); !avail.Available {
		return model.User{}, siloErrors.ErrUserEmailExists
	}

	oldEmail := user.Email
	user.Email = change.NewEmail
	user.IsEmailVerified = true
	updated, err := s.dp.UserStore.UpdateUser(ctx, user)
	if err != nil {
		return model.User{}, err
	}
	_ = s.dp.ConfirmationStore.UseEmailChange(ctx, change.ID)
	_ = s.dp.EmailingService.SendEmail(ctx, messagingModel.EmailPayload{
		To:      oldEmail,
		Subject: "Your Silo email was changed",
		Body:    templates.EmailChangedNotice(change.NewEmail),
	})
	return updated, nil
}

// deleteUploadedFile removes a file the user uploaded through /upload, given
// its public URL. Only files under the user's own folder in the public
// bucket are touched; anything else (an external URL) is left alone.
func (s *service) deleteUploadedFile(ctx context.Context, userID uuid.UUID, url string) {
	base := strings.TrimRight(s.dp.Env.Get(modelEnv.StoragePublicURL), "/")
	if base == "" {
		return
	}
	key := strings.TrimPrefix(url, base+"/")
	if key == url || !strings.HasPrefix(key, userID.String()+"/") {
		return
	}
	if err := s.dp.ObjectStorage.Delete(ctx, s.dp.StoragePublicBucket, key); err != nil {
		log := siloLogger.FromCtx(ctx)
		log.Warn().Err(err).Str("key", key).Msg("failed to delete old upload")
	}
}

// DeletedRetention is how long a deleted account or portfolio is kept, so
// support can restore it, before PurgeDeletedAccounts removes it for good.
const DeletedRetention = 30 * 24 * time.Hour

func (s *service) PurgeDeletedAccounts(ctx context.Context) error {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "user.PurgeDeletedAccounts").
		Logger()

	cutoff := time.Now().UTC().Add(-DeletedRetention)

	// Files first: once the rows are gone nothing points at them any more.
	keys, err := s.dp.UserStore.ListPurgeableFiles(ctx, cutoff)
	if err != nil {
		return err
	}
	for _, key := range keys {
		if err := s.dp.ObjectStorage.Delete(ctx, s.dp.StoragePrivateBucket, key); err != nil {
			log.Warn().Err(err).Str("key", key).Msg("failed to delete purged file")
		}
	}

	users, portfolios, err := s.dp.UserStore.PurgeDeleted(ctx, cutoff)
	if err != nil {
		log.Error().Err(err).Msg("failed to purge deleted accounts")
		return err
	}
	log.Info().Int64("users", users).Int64("portfolios", portfolios).Int("files", len(keys)).
		Msg("deleted accounts purged")
	return nil
}

// Onboard completes onboarding for the user.
// Returns ErrAlreadyOnboarded when is_onboarded is already true.
func (s *service) Onboard(ctx context.Context, id uuid.UUID, req model.OnboardRequest) (model.User, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "user.Onboard").
		Str("user_id", id.String()).
		Logger()

	user, err := s.dp.UserStore.GetUserByID(ctx, id)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch user for onboarding")
		return model.User{}, err
	}

	if user.IsOnboarded {
		return model.User{}, siloErrors.ErrAlreadyOnboarded
	}

	if err := s.dp.UserStore.CompleteOnboarding(ctx, id, req); err != nil {
		log.Error().Err(err).Msg("failed to complete onboarding")
		return model.User{}, siloErrors.ErrGenericErr
	}

	// Re-fetch to return the updated state.
	updated, err := s.dp.UserStore.GetUserByID(ctx, id)
	if err != nil {
		log.Error().Err(err).Msg("failed to re-fetch user after onboarding")
		return model.User{}, err
	}

	log.Info().Msg("user onboarded")
	return updated, nil
}
