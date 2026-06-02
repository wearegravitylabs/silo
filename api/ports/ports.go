// Package ports defines the interface contracts that cloud-only implementations must satisfy.
//
// The open-source binary leaves all of these nil inside app.Dependency.
// The private silo-cloud repo provides concrete implementations and injects them at startup.
// Service code should nil-check a port before calling it and surface a graceful error or
// fall back to the manual workflow when it is not available.
package ports

import (
	"context"

	"github.com/google/uuid"
)

// BankAccount is a connected bank account returned by a BankConnector.
type BankAccount struct {
	AccountID   string
	Institution string
	Name        string
	Type        string // checking | savings | money_market
	Balance     float64
	Currency    string
	Last4       string
}

// BankConnector abstracts open-banking integrations such as Plaid.
// Only available in the managed cloud version.
type BankConnector interface {
	// CreateLinkToken returns a short-lived token for the client-side Link flow.
	CreateLinkToken(ctx context.Context, userID uuid.UUID) (string, error)
	// ExchangePublicToken exchanges a public token returned by the Link flow for an access token.
	ExchangePublicToken(ctx context.Context, userID uuid.UUID, publicToken string) error
	// GetAccounts returns all connected accounts for a user.
	GetAccounts(ctx context.Context, userID uuid.UUID) ([]BankAccount, error)
	// SyncBalances refreshes balances for all connected accounts.
	SyncBalances(ctx context.Context, userID uuid.UUID) error
	// Disconnect removes the bank connection for a user.
	Disconnect(ctx context.Context, userID uuid.UUID, itemID string) error
}

// Notification is a push notification payload.
type Notification struct {
	Title string
	Body  string
	Data  map[string]string
}

// NotificationProvider abstracts push notification delivery (FCM, APNs).
// Only available in the managed cloud version.
type NotificationProvider interface {
	// SendToUser sends a push notification to all registered devices of a user.
	SendToUser(ctx context.Context, userID uuid.UUID, n Notification) error
	// RegisterDevice registers a device token for push notifications.
	RegisterDevice(ctx context.Context, userID uuid.UUID, deviceToken, platform string) error
}

// Subscription holds billing status for a cloud user.
type Subscription struct {
	Plan      string // "monthly" | "yearly"
	Status    string // "active" | "trialing" | "past_due" | "canceled"
	ExpiresAt string // RFC3339
}

// BillingProvider abstracts payment and subscription management (Stripe).
// Only available in the managed cloud version.
type BillingProvider interface {
	// CreateCheckoutSession returns a URL for the Stripe Checkout page.
	CreateCheckoutSession(ctx context.Context, userID uuid.UUID, plan string) (string, error)
	// GetSubscription returns the current subscription for a user.
	GetSubscription(ctx context.Context, userID uuid.UUID) (*Subscription, error)
	// CancelSubscription cancels a user's active subscription.
	CancelSubscription(ctx context.Context, userID uuid.UUID) error
	// HandleWebhook processes incoming Stripe webhook events.
	HandleWebhook(ctx context.Context, payload []byte, signature string) error
}
