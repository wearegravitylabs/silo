# Open-Core Architecture

Silo uses an **open-core** model: the full application is AGPL v3 open-source, and cloud-only features (Plaid bank connections, Stripe billing, push notifications) live in a separate private repository (`wearegravitylabs/silo-cloud`) that imports the core.

## How it works

### 1. Interface contracts (`api/ports/ports.go`)

The public repo defines Go interfaces for every cloud-only capability:

```go
// BankConnector abstracts Plaid and similar open-banking integrations.
type BankConnector interface {
    CreateLinkToken(ctx context.Context, userID uuid.UUID) (string, error)
    GetAccounts(ctx context.Context, userID uuid.UUID) ([]BankAccount, error)
    SyncBalances(ctx context.Context, userID uuid.UUID) error
    // ...
}
```

### 2. Dependency injection (`api/app/dependency.go`)

The `Dependency` struct holds optional fields for each port:

```go
type Dependency struct {
    // ... stores and third-party services

    // Cloud ports — nil in the OSS build
    BankConnector        ports.BankConnector        // Plaid
    NotificationProvider ports.NotificationProvider // FCM / APNs
    BillingProvider      ports.BillingProvider      // Stripe
}
```

### 3. OSS binary

In the self-hosted build, these fields are `nil`. Service code nil-checks before using them:

```go
if dp.BankConnector == nil {
    // Fall back to manual bank balance entry
    return model.ErrFeatureCloudOnly
}
```

### 4. Cloud binary (`silo-cloud`)

The private repo:
- Imports `github.com/wearegravitylabs/silo/api` as a dependency
- Implements the `ports.*` interfaces (PlaidConnector, StripeProvider, FCMProvider)
- Calls `app.InitDp(...)` and then injects its implementations:

```go
dp := app.InitDp(store, env)
dp.BankConnector = plaid.New(env.Get("PLAID_CLIENT_ID"), env.Get("PLAID_SECRET"))
dp.BillingProvider = stripe.New(env.Get("STRIPE_SECRET_KEY"))
```

## Feature matrix

| Feature | OSS (self-hosted) | Cloud (managed) |
|---------|:-----------------:|:---------------:|
| All asset/debt tracking | ✅ | ✅ |
| Auto-Pilot rules | ✅ | ✅ |
| AI insights (own key) | ✅ | ✅ |
| Vault encryption | ✅ | ✅ |
| Multi-user portfolios | ✅ | ✅ |
| Bank connections (Plaid) | ❌ | ✅ |
| Push notifications | ❌ | ✅ |
| Subscription billing | ❌ | ✅ |
| Managed hosting | ❌ | ✅ |

## Why AGPL v3?

The AGPL v3 license ensures that anyone who runs Silo as a hosted service must open-source their modifications. This protects the project from being taken closed-source while keeping the full codebase available for self-hosting.
