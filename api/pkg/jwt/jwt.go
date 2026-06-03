// Package jwt provides helpers for issuing and validating HS256 JWTs.
package jwt

import (
	"errors"
	"time"

	gojwt "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// claims is the private JWT payload.
type claims struct {
	UserID uuid.UUID `json:"user_id"`
	gojwt.RegisteredClaims
}

// GenerateAccessToken issues a signed HS256 JWT for the given user.
func GenerateAccessToken(userID uuid.UUID, secret string, expiry time.Duration) (string, error) {
	now := time.Now().UTC()
	c := claims{
		UserID: userID,
		RegisteredClaims: gojwt.RegisteredClaims{
			IssuedAt:  gojwt.NewNumericDate(now),
			ExpiresAt: gojwt.NewNumericDate(now.Add(expiry)),
		},
	}
	token := gojwt.NewWithClaims(gojwt.SigningMethodHS256, c)
	return token.SignedString([]byte(secret))
}

// ValidateToken parses and validates a signed JWT, returning the user ID on success.
func ValidateToken(tokenString, secret string) (uuid.UUID, error) {
	var c claims
	token, err := gojwt.ParseWithClaims(tokenString, &c, func(t *gojwt.Token) (any, error) {
		if _, ok := t.Method.(*gojwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return uuid.Nil, errors.New("invalid or expired token")
	}
	return c.UserID, nil
}
