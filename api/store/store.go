// Package store implements the GORM-based data access layer.
package store

import (
	"fmt"

	"github.com/rs/zerolog"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/wearegravitylabs/silo/api/pkg/environment"
	modelEnv "github.com/wearegravitylabs/silo/api/model/env"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
)

// Store is the root GORM accessor shared by all repository implementations.
type Store struct {
	Logger *zerolog.Logger
	DB     *gorm.DB
	Env    *environment.Env
}

// New opens a PostgreSQL connection and returns a Store.
func New(env *environment.Env) *Store {
	log := siloLogger.New()

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s dbname=%s password=%s sslmode=%s",
		env.GetWithDefault(modelEnv.PGAddress, "localhost"),
		env.GetWithDefault(modelEnv.PGPort, "5432"),
		env.GetWithDefault(modelEnv.PGUser, "silo"),
		env.GetWithDefault(modelEnv.PGDatabase, "silo"),
		env.Get(modelEnv.PGPassword),
		env.GetWithDefault(modelEnv.PGSSLMode, "disable"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Silent),
	})
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to database")
	}

	return &Store{Logger: &log, DB: db, Env: env}
}

// NewFromDB wraps an existing *gorm.DB — useful in tests.
func NewFromDB(db *gorm.DB) *Store {
	log := siloLogger.New()
	return &Store{Logger: &log, DB: db}
}
