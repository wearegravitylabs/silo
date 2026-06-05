// Package storage provides a factory for selecting the configured object storage provider.
package storage

import (
	"context"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/wearegravitylabs/silo/api/pkg/environment"
	s3storage "github.com/wearegravitylabs/silo/api/thirdparty/storage/s3"
)

// Provider identifies the active storage backend.
type Provider string

const (
	ProviderS3    Provider = "s3"
	ProviderR2    Provider = "r2"
	ProviderMinIO Provider = "minio"
)

// NewFromEnv reads STORAGE_PROVIDER from the environment and returns the
// appropriate ObjectStorage implementation.
//
// If STORAGE_PROVIDER is not set or is empty, a no-op stub is returned so
// the server starts without panicking in local development.
func NewFromEnv(ctx context.Context, env *environment.Env) (ObjectStorage, error) {
	provider := Provider(strings.ToLower(strings.TrimSpace(env.Get("STORAGE_PROVIDER"))))

	bucket := env.GetWithDefault("STORAGE_BUCKET", "silo")
	privateBucket := env.GetWithDefault("STORAGE_PRIVATE_BUCKET", bucket+"-docs")

	switch provider {
	case ProviderS3:
		return s3storage.New(ctx, s3storage.Config{
			AccessKey:      env.Get("STORAGE_ACCESS_KEY"),
			SecretKey:      env.Get("STORAGE_SECRET_KEY"),
			Bucket:         bucket,
			PrivateBucket:  privateBucket,
			Region:         env.GetWithDefault("STORAGE_REGION", "us-east-1"),
			ForcePathStyle: false,
			PublicURL:      env.Get("STORAGE_PUBLIC_URL"),
		})

	case ProviderR2:
		return s3storage.New(ctx, s3storage.Config{
			Endpoint:       env.Get("STORAGE_ENDPOINT"),
			AccessKey:      env.Get("STORAGE_ACCESS_KEY"),
			SecretKey:      env.Get("STORAGE_SECRET_KEY"),
			Bucket:         bucket,
			PrivateBucket:  privateBucket,
			Region:         env.GetWithDefault("STORAGE_REGION", "auto"),
			ForcePathStyle: false,
			PublicURL:      env.Get("STORAGE_PUBLIC_URL"),
		})

	case ProviderMinIO:
		return s3storage.New(ctx, s3storage.Config{
			Endpoint:       env.GetWithDefault("STORAGE_ENDPOINT", "http://localhost:9000"),
			AccessKey:      env.GetWithDefault("STORAGE_ACCESS_KEY", "minioadmin"),
			SecretKey:      env.GetWithDefault("STORAGE_SECRET_KEY", "minioadmin"),
			Bucket:         bucket,
			PrivateBucket:  privateBucket,
			Region:         env.GetWithDefault("STORAGE_REGION", "us-east-1"),
			ForcePathStyle: true,
			PublicURL:      env.Get("STORAGE_PUBLIC_URL"),
		})

	case "":
		// No storage configured — return a stub so the server starts in dev.
		return &noopStorage{}, nil

	default:
		return nil, fmt.Errorf("storage: unknown provider %q — must be s3, r2, or minio", provider)
	}
}

// noopStorage is a zero-value stub returned when no provider is configured.
// All operations return an error explaining what's missing.
type noopStorage struct{}

func (n *noopStorage) Upload(_ context.Context, _, _ string, _ io.Reader, _ int64) (string, error) {
	return "", fmt.Errorf("storage: no provider configured — set STORAGE_PROVIDER in your .env")
}
func (n *noopStorage) Download(_ context.Context, _, _ string) (io.ReadCloser, error) {
	return nil, fmt.Errorf("storage: no provider configured — set STORAGE_PROVIDER in your .env")
}
func (n *noopStorage) Delete(_ context.Context, _, _ string) error {
	return fmt.Errorf("storage: no provider configured — set STORAGE_PROVIDER in your .env")
}
func (n *noopStorage) PresignedURL(_ context.Context, _, _ string, _ time.Duration) (string, error) {
	return "", fmt.Errorf("storage: no provider configured — set STORAGE_PROVIDER in your .env")
}
