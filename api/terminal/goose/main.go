// Command goose is a thin wrapper around the goose migration tool.
package main

import (
	"fmt"
	"os"

	"github.com/pressly/goose/v3"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/wearegravitylabs/silo/api/pkg/environment"
	modelEnv "github.com/wearegravitylabs/silo/api/model/env"
)

func main() {
	env, err := environment.New()
	if err != nil {
		fmt.Fprintln(os.Stderr, "failed to load env:", err)
		os.Exit(1)
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s dbname=%s password=%s sslmode=%s",
		env.GetWithDefault(modelEnv.PGAddress, "localhost"),
		env.GetWithDefault(modelEnv.PGPort, "5432"),
		env.GetWithDefault(modelEnv.PGUser, "silo"),
		env.GetWithDefault(modelEnv.PGDatabase, "silo"),
		env.Get(modelEnv.PGPassword),
		env.GetWithDefault(modelEnv.PGSSLMode, "disable"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Fprintln(os.Stderr, "failed to connect to db:", err)
		os.Exit(1)
	}

	sqlDB, err := db.DB()
	if err != nil {
		fmt.Fprintln(os.Stderr, "failed to get sql.DB:", err)
		os.Exit(1)
	}

	goose.SetBaseFS(nil)

	args := os.Args[1:]
	if len(args) == 0 {
		args = []string{"status"}
	}

	if err := goose.RunContext(nil, args[0], sqlDB, "migration", args[1:]...); err != nil {
		fmt.Fprintln(os.Stderr, "goose error:", err)
		os.Exit(1)
	}
}
