// Package resend implements email.EmailingService using the Resend API (v3).
package resend

import (
	"context"
	"fmt"

	resendSDK "github.com/resend/resend-go/v3"

	"github.com/wearegravitylabs/silo/api/thirdparty/messaging/email"
	messagingModel "github.com/wearegravitylabs/silo/api/thirdparty/messaging/model"
)

type client struct {
	sdk       *resendSDK.Client
	fromEmail string
	fromName  string
}

// New returns an EmailingService backed by Resend.
// fromEmail must be a verified sender domain in your Resend account (e.g. sandbox@wearegravitylabs.com).
func New(apiKey, fromEmail, fromName string) email.EmailingService {
	return &client{
		sdk:       resendSDK.NewClient(apiKey),
		fromEmail: fromEmail,
		fromName:  fromName,
	}
}

// SendEmail delivers a transactional email via the Resend API.
func (c *client) SendEmail(ctx context.Context, payload messagingModel.EmailPayload) error {
	from := fmt.Sprintf("%s <%s>", c.fromName, c.fromEmail)
	params := &resendSDK.SendEmailRequest{
		From:    from,
		To:      []string{payload.To},
		Subject: payload.Subject,
		Html:    payload.Body,
	}
	_, err := c.sdk.Emails.SendWithContext(ctx, params)
	return err
}
