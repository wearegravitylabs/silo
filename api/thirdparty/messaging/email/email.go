// Package email defines the email service interface and a stub implementation.
package email

import (
	"context"
	"fmt"

	messagingModel "github.com/wearegravitylabs/silo/api/thirdparty/messaging/model"
)

//go:generate mockgen -source email.go -destination ./mock/mock_email.go -package mock EmailingService

// EmailingService is the interface for sending transactional emails.
type EmailingService interface {
	SendEmail(ctx context.Context, payload messagingModel.EmailPayload) error
}

// NoOpEmailer is a stub that logs emails without actually sending them.
// Use in development or when no email provider is configured.
type NoOpEmailer struct{}

// New returns a no-op email service (placeholder until a real provider is wired).
func New() EmailingService { return &NoOpEmailer{} }

func (n *NoOpEmailer) SendEmail(_ context.Context, payload messagingModel.EmailPayload) error {
	fmt.Printf("[email stub] To: %s | Subject: %s\n", payload.To, payload.Subject)
	return nil
}
