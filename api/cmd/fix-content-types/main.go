// Command fix-content-types sets the right content type on files uploaded
// before the API passed one to storage. Those were all stored as
// application/octet-stream, so browsers downloaded images instead of showing
// them. It reads the same STORAGE_* settings as the API and is safe to run
// more than once.
//
//	cd api && go run ./cmd/fix-content-types
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/wearegravitylabs/silo/api/pkg/environment"
	"github.com/wearegravitylabs/silo/api/thirdparty/storage"
	s3storage "github.com/wearegravitylabs/silo/api/thirdparty/storage/s3"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	ctx := context.Background()
	env, err := environment.New()
	if err != nil {
		return err
	}
	store, err := storage.NewFromEnv(ctx, env)
	if err != nil {
		return err
	}
	client, ok := store.(*s3storage.Client)
	if !ok {
		return fmt.Errorf("STORAGE_PROVIDER is not set; nothing to fix")
	}

	bucket := env.GetWithDefault("STORAGE_BUCKET", "silo")
	for _, b := range []string{bucket, env.GetWithDefault("STORAGE_PRIVATE_BUCKET", bucket+"-docs")} {
		n, err := client.FixContentTypes(ctx, b)
		if err != nil {
			return err
		}
		fmt.Printf("%s: fixed %d file(s)\n", b, n)
	}
	return nil
}
