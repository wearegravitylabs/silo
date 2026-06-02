// Package app wires all service dependencies together.
package app

import (
	"github.com/rs/zerolog"

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
	"github.com/wearegravitylabs/silo/api/thirdparty/storage"
	storageMinIO "github.com/wearegravitylabs/silo/api/thirdparty/storage/minio"
	modelEnv "github.com/wearegravitylabs/silo/api/model/env"
)

// Dependency holds all shared dependencies available to service implementations.
type Dependency struct {
	Logger zerolog.Logger
	Env    *environment.Env

	// Store layer
	UserStore      store.UserDatabase
	PortfolioStore store.PortfolioDatabase
	AssetStore     store.AssetDatabase
	DebtStore      store.DebtDatabase
	AutopilotStore store.AutopilotDatabase
	SnapshotStore  store.SnapshotDatabase

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
func InitDp(s *store.Store, env *environment.Env) Dependency {
	log := siloLogger.New()

	return Dependency{
		Logger: log,
		Env:    env,

		// Store layer
		UserStore:      store.NewUserStore(s),
		PortfolioStore: store.NewPortfolioStore(s),
		AssetStore:     store.NewAssetStore(s),
		DebtStore:      store.NewDebtStore(s),
		AutopilotStore: store.NewAutopilotStore(s),
		SnapshotStore:  store.NewSnapshotStore(s),

		// Third-party
		StockMarket:     yahoo.New(env.Get(modelEnv.YahooFinanceBaseURL)),
		CryptoMarket:    coingecko.New(env.Get(modelEnv.CoinGeckoAPIKey), env.Get(modelEnv.CoinGeckoBaseURL)),
		AIProvider:      claude.New(env.Get(modelEnv.AnthropicAPIKey), env.Get(modelEnv.ClaudeModel)),
		ObjectStorage:   storageMinIO.New(env.Get(modelEnv.MinIOEndpoint), env.Get(modelEnv.MinIOAccessKey), env.Get(modelEnv.MinIOSecretKey), env.GetBool(modelEnv.MinIOUseSSL)),
		EmailingService: email.New(),

		// Cloud ports — nil by default; injected by silo-cloud at startup
		BankConnector:        nil,
		NotificationProvider: nil,
		BillingProvider:      nil,
	}
}
