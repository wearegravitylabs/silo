// Package auth implements magic-link OTP authentication.
package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"time"

	"github.com/wearegravitylabs/silo/api/app"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	modelEnv "github.com/wearegravitylabs/silo/api/model/env"
	"github.com/wearegravitylabs/silo/api/pkg/crypto"
	"github.com/wearegravitylabs/silo/api/pkg/helpers"
	siloJWT "github.com/wearegravitylabs/silo/api/pkg/jwt"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
	messagingModel "github.com/wearegravitylabs/silo/api/thirdparty/messaging/model"
	"github.com/wearegravitylabs/silo/api/thirdparty/messaging/templates"
)

//go:generate mockgen -source auth.go -destination ../mock/auth/mock_auth.go -package auth Auth

// Auth defines magic-link OTP authentication operations.
type Auth interface {
	// SendCode upserts the user by email and sends a 6-digit OTP via email.
	SendCode(ctx context.Context, email string) error
	// VerifyCode validates the OTP, marks the email as verified, and returns tokens.
	VerifyCode(ctx context.Context, email, code string) (model.AuthResponse, error)
	// RefreshToken validates a refresh token and issues a new access JWT.
	RefreshToken(ctx context.Context, rawToken string) (accessToken string, err error)
}

type service struct{ dp app.Dependency }

// New returns an Auth service backed by the provided dependency container.
func New(dp app.Dependency) Auth { return &service{dp: dp} }

// SendCode upserts the user record for the given email address, generates a
// cryptographically random 6-digit OTP, stores a bcrypt hash of it with an
// expiry read from OTP_EXPIRY (default 10 m), then dispatches the code via email.
func (s *service) SendCode(ctx context.Context, emailAddr string) error {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "auth.SendCode").
		Logger()

	// 1. Upsert user — create on first sign-in, return existing on subsequent ones.
	user, err := s.dp.UserStore.UpsertUserByEmail(ctx, emailAddr)
	if err != nil {
		log.Error().Err(err).Str("email", emailAddr).Msg("upsert user failed")
		return err
	}

	// 2. Generate a cryptographically random 6-digit numeric OTP.
	n, err := rand.Int(rand.Reader, big.NewInt(1_000_000))
	if err != nil {
		log.Error().Err(err).Msg("failed to generate OTP")
		return siloErrors.ErrGenericErr
	}
	plainCode := fmt.Sprintf("%06d", n.Int64())

	// 3. Bcrypt-hash the OTP before storing (protects at rest; OTP is short-lived).
	hashedCode, err := crypto.HashPassword(plainCode)
	if err != nil {
		log.Error().Err(err).Msg("failed to hash OTP")
		return siloErrors.ErrGenericErr
	}

	// 4. Determine expiry from env, then persist.
	otpExpiry := helpers.ParseDuration(s.dp.Env.GetWithDefault(modelEnv.OTPExpiry, "10m"), 10*time.Minute)
	expiry := time.Now().UTC().Add(otpExpiry)

	if err = s.dp.UserStore.StoreOTP(ctx, user.ID, hashedCode, expiry); err != nil {
		log.Error().Err(err).Msg("failed to store OTP")
		return err
	}

	// 5. Send the plain-text code to the user via Resend.
	if err = s.dp.EmailingService.SendEmail(ctx, messagingModel.EmailPayload{
		To:      emailAddr,
		Subject: "Your Silo sign-in code",
		Body:    templates.OTPEmail(plainCode, otpExpiry),
	}); err != nil {
		log.Error().Err(err).Msg("failed to send OTP email")
		return siloErrors.ErrGenericErr
	}

	log.Info().Str("user_id", user.ID.String()).Msg("OTP sent")
	return nil
}

// VerifyCode checks the provided OTP against the stored hash, clears it on
// success, marks the user's email as verified, and returns a short-lived access
// JWT plus an opaque refresh token.
func (s *service) VerifyCode(ctx context.Context, emailAddr, code string) (model.AuthResponse, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "auth.VerifyCode").
		Logger()

	// 1. Fetch user. Return ErrInvalidOTP on not-found to prevent email enumeration.
	user, err := s.dp.UserStore.GetUserByEmail(ctx, emailAddr)
	if err != nil {
		return model.AuthResponse{}, siloErrors.ErrInvalidOTP
	}

	// 2. Guard: no OTP is stored (code was never requested or already consumed).
	if user.OTPCode == "" || user.OTPExpiry == nil {
		return model.AuthResponse{}, siloErrors.ErrInvalidOTP
	}

	// 3. Check expiry.
	if time.Now().UTC().After(*user.OTPExpiry) {
		return model.AuthResponse{}, siloErrors.ErrInvalidOTP
	}

	// 4. Bcrypt compare — constant-time to prevent timing attacks.
	if !crypto.CheckPassword(code, user.OTPCode) {
		return model.AuthResponse{}, siloErrors.ErrInvalidOTP
	}

	// 5. Consume the OTP and mark the email as verified.
	if err := s.dp.UserStore.ClearOTP(ctx, user.ID); err != nil {
		log.Error().Err(err).Msg("failed to clear OTP")
		return model.AuthResponse{}, err
	}
	user.IsEmailVerified = true

	// 6. Issue access JWT.
	accessExpiry := helpers.ParseDuration(s.dp.Env.GetWithDefault(modelEnv.JWTAccessTokenExpiry, "15m"), 15*time.Minute)
	secret := s.dp.Env.Get(modelEnv.JWTSigningSecret)

	accessToken, err := siloJWT.GenerateAccessToken(user.ID, secret, accessExpiry)
	if err != nil {
		log.Error().Err(err).Msg("failed to generate access token")
		return model.AuthResponse{}, siloErrors.ErrGenericErr
	}

	// 7. Generate an opaque 32-byte random refresh token (64-char hex string).
	rawRefresh, err := crypto.GenerateRandomKey(32)
	if err != nil {
		log.Error().Err(err).Msg("failed to generate refresh token")
		return model.AuthResponse{}, siloErrors.ErrGenericErr
	}

	// 8. SHA-256 hash for storage — deterministic and safe for lookup (bcrypt is not).
	sum := sha256.Sum256([]byte(rawRefresh))
	tokenHash := hex.EncodeToString(sum[:])

	// 9. Persist the refresh token.
	refreshExpiry := helpers.ParseDuration(s.dp.Env.GetWithDefault(modelEnv.JWTRefreshTokenExpiry, "720h"), 30*24*time.Hour)
	rt := model.RefreshToken{
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().UTC().Add(refreshExpiry),
	}
	if _, err := s.dp.RefreshTokenStore.CreateRefreshToken(ctx, rt); err != nil {
		log.Error().Err(err).Msg("failed to store refresh token")
		return model.AuthResponse{}, err
	}

	log.Info().Str("user_id", user.ID.String()).Msg("user verified, tokens issued")

	return model.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: rawRefresh,
		User:         user,
	}, nil
}

// RefreshToken validates an opaque refresh token and issues a fresh access JWT.
// The refresh token itself is not rotated.
func (s *service) RefreshToken(ctx context.Context, rawToken string) (string, error) {
	log := siloLogger.FromCtx(ctx).With().
		Str(siloLogger.LogStrKeyMethod, "auth.RefreshToken").
		Logger()

	// 1. SHA-256 hash the incoming raw token for deterministic DB lookup.
	sum := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(sum[:])

	// 2. Fetch the stored (non-revoked) record.
	stored, err := s.dp.RefreshTokenStore.GetByTokenHash(ctx, tokenHash)
	if err != nil {
		return "", siloErrors.ErrInvalidToken
	}

	// 3. Check expiry and revoke proactively if expired.
	if time.Now().UTC().After(stored.ExpiresAt) {
		_ = s.dp.RefreshTokenStore.RevokeToken(ctx, stored.ID)
		return "", siloErrors.ErrInvalidToken
	}

	// 4. Issue a new access JWT.
	accessExpiry := helpers.ParseDuration(s.dp.Env.GetWithDefault(modelEnv.JWTAccessTokenExpiry, "15m"), 15*time.Minute)
	secret := s.dp.Env.Get(modelEnv.JWTSigningSecret)

	accessToken, err := siloJWT.GenerateAccessToken(stored.UserID, secret, accessExpiry)
	if err != nil {
		log.Error().Err(err).Msg("failed to generate access token on refresh")
		return "", siloErrors.ErrGenericErr
	}

	return accessToken, nil
}
