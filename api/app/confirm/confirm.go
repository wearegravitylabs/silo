// Package confirm sends and checks the 6-digit codes that confirm risky
// actions (deleting an account or a portfolio).
package confirm

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	"github.com/wearegravitylabs/silo/api/pkg/crypto"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
	messagingModel "github.com/wearegravitylabs/silo/api/thirdparty/messaging/model"
	"github.com/wearegravitylabs/silo/api/thirdparty/messaging/templates"
)

const (
	// Expiry is how long a code works.
	Expiry = 10 * time.Minute
	// MaxAttempts is how many wrong tries burn a code.
	MaxAttempts = 5
)

var actions = map[model.ConfirmationPurpose]string{
	model.PurposeDeleteAccount:       "delete your Silo account",
	model.PurposeDeletePortfolio:     "delete a portfolio",
	model.PurposeChangeVaultPassword: "change a vault password",
}

// Send emails a new code for the action. Earlier unused codes for the same
// action stop working.
func Send(ctx context.Context, dp app.Dependency, user model.User, purpose model.ConfirmationPurpose, targetID *uuid.UUID) error {
	log := siloLogger.FromCtx(ctx).With().Str(siloLogger.LogStrKeyMethod, "confirm.Send").Logger()

	n, err := rand.Int(rand.Reader, big.NewInt(1_000_000))
	if err != nil {
		return siloErrors.ErrGenericErr
	}
	code := fmt.Sprintf("%06d", n.Int64())
	hash, err := crypto.HashPassword(code)
	if err != nil {
		return siloErrors.ErrGenericErr
	}
	if err := dp.ConfirmationStore.CreateCode(ctx, model.ConfirmationCode{
		UserID: user.ID, Purpose: purpose, TargetID: targetID, CodeHash: hash,
		ExpiresAt: time.Now().UTC().Add(Expiry), CreatedAt: time.Now().UTC(),
	}); err != nil {
		return err
	}
	if err := dp.EmailingService.SendEmail(ctx, messagingModel.EmailPayload{
		To:      user.Email,
		Subject: "Your Silo confirmation code",
		Body:    templates.ConfirmActionEmail(actions[purpose], code, Expiry),
	}); err != nil {
		log.Error().Err(err).Msg("failed to send confirmation code")
		return siloErrors.ErrGenericErr
	}
	return nil
}

// Check uses up the latest code for the action if code matches it. Wrong or
// expired codes are ErrInvalidCode; after MaxAttempts wrong tries the code
// stops working. In sandbox mode "000000" is always accepted.
func Check(ctx context.Context, dp app.Dependency, userID uuid.UUID, purpose model.ConfirmationPurpose, targetID *uuid.UUID, code string) error {
	stored, err := dp.ConfirmationStore.LatestCode(ctx, userID, purpose, targetID)
	if dp.Env.IsSandbox() && code == "000000" {
		if err == nil {
			_ = dp.ConfirmationStore.UseCode(ctx, stored.ID)
		}
		return nil
	}
	if err != nil {
		return siloErrors.ErrInvalidCode
	}
	if stored.Attempts >= MaxAttempts {
		_ = dp.ConfirmationStore.UseCode(ctx, stored.ID)
		return siloErrors.ErrInvalidCode
	}
	if !crypto.CheckPassword(code, stored.CodeHash) {
		_ = dp.ConfirmationStore.AddAttempt(ctx, stored.ID)
		return siloErrors.ErrInvalidCode
	}
	return dp.ConfirmationStore.UseCode(ctx, stored.ID)
}
