// Package app wires all service dependencies together.
package app

import (
	"context"

	"github.com/rs/zerolog"

	modelEnv "github.com/wearegravitylabs/silo/api/model/env"
	"github.com/wearegravitylabs/silo/api/pkg/environment"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
	"github.com/wearegravitylabs/silo/api/ports"
	"github.com/wearegravitylabs/silo/api/store"
	"github.com/wearegravitylabs/silo/api/thirdparty/ai"
	"github.com/wearegravitylabs/silo/api/thirdparty/ai/claude"
	"github.com/wearegravitylabs/silo/api/thirdparty/market"
	"github.com/wearegravitylabs/silo/api/thirdparty/market/coingecko"
	"github.com/wearegravitylabs/silo/api/thirdparty/market/yahoo"
	"github.com/wearegravitylabs/silo/api/thirdparty/messaging/email"
	resendProvider "github.com/wearegravitylabs/silo/api/thirdparty/messaging/resend"
	"github.com/wearegravitylabs/silo/api/thirdparty/storage"
)

// Dependency holds all shared dependencies available to service implementations.
type Dependency struct {
	Logger zerolog.Logger
	Env    *environment.Env

	// Store layer
	UserStore            store.UserDatabase
	PortfolioStore       store.PortfolioDatabase
	AssetStore           store.AssetDatabase
	AssetLotStore        store.AssetLotDatabase
	AssetCashFlowStore   store.AssetCashFlowDatabase
	AssetValueHistStore  store.AssetValueHistoryDatabase
	DebtStore            store.DebtDatabase
	AutopilotStore       store.AutopilotDatabase
	SnapshotStore        store.SnapshotDatabase
	RefreshTokenStore    store.RefreshTokenDatabase
	FolderStore          store.FolderDatabase

	// Third-party services
	StockMarket     market.MarketDataProvider // Yahoo Finance
	CryptoMarket    market.MarketDataProvider // CoinGecko
	AIProvider      ai.AIProvider
	ObjectStorage   storage.ObjectStorage
	EmailingService email.EmailingService

	// Cloud-only ports (nil in the OSS build; silo-cloud injects implementations)
	BankConnector        ports.BankConnector
	NotificationProvider ports.NotificationProvider
	BillingProvider      ports.BillingProvider
}

// InitDp builds and returns a fully wired Dependency using the given store and env.
func InitDp(ctx context.Context, s *store.Store, env *environment.Env) Dependency {
	log := siloLogger.New()

	// Wire email provider: use Resend when API key is present, fall back to no-op for local dev.
	var emailSvc email.EmailingService
	if resendKey := env.Get(modelEnv.ResendAPIKey); resendKey != "" {
		emailSvc = resendProvider.New(
			resendKey,
			env.GetWithDefault(modelEnv.ResendFromEmail, "noreply@silo.app"),
			env.GetWithDefault(modelEnv.ResendFromName, "Silo"),
		)
	} else {
		emailSvc = email.New() // NoOpEmailer — logs to stdout
	}

	return Dependency{
		Logger: log,
		Env:    env,

		// Store layer
		UserStore:           store.NewUserStore(s),
		PortfolioStore:      store.NewPortfolioStore(s),
		AssetStore:          store.NewAssetStore(s),
		AssetLotStore:       store.NewAssetLotStore(s),
		AssetCashFlowStore:  store.NewAssetCashFlowStore(s),
		AssetValueHistStore: store.NewAssetValueHistoryStore(s),
		DebtStore:           store.NewDebtStore(s),
		AutopilotStore:      store.NewAutopilotStore(s),
		SnapshotStore:       store.NewSnapshotStore(s),
		RefreshTokenStore:   store.NewRefreshTokenStore(s),
		FolderStore:         store.NewFolderStore(s),

		// Third-party
		StockMarket:     yahoo.New(env.Get(modelEnv.YahooFinanceBaseURL)),
		CryptoMarket:    coingecko.New(env.Get(modelEnv.CoinGeckoAPIKey), env.Get(modelEnv.CoinGeckoBaseURL)),
		AIProvider:      claude.New(env.Get(modelEnv.AnthropicAPIKey), env.Get(modelEnv.ClaudeModel)),
		ObjectStorage:   mustStorage(ctx, env),
		EmailingService: emailSvc,

		BankConnector:        nil,
		NotificationProvider: nil,
		BillingProvider:      nil,
	}
}

// mustStorage initialises the object storage provider from env vars.
// Panics on misconfiguration (wrong provider name) so the problem is caught
// at startup rather than silently at runtime.
func mustStorage(ctx context.Context, env *environment.Env) storage.ObjectStorage {
	s, err := storage.NewFromEnv(ctx, env)
	if err != nil {
		panic("storage: " + err.Error())
	}
	return s
}
