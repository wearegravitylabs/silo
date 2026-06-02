// Package storage defines the object storage interface.
package storage

import (
	"context"
	"io"
	"time"
)

//go:generate mockgen -source storage.go -destination ./mock/mock_storage.go -package mock ObjectStorage

// ObjectStorage is the interface for storing and retrieving binary objects (documents, vault files).
type ObjectStorage interface {
	// Upload stores data at the given key within the bucket and returns the storage path.
	Upload(ctx context.Context, bucket, key string, data io.Reader, size int64) (string, error)
	// Download retrieves an object by key.
	Download(ctx context.Context, bucket, key string) (io.ReadCloser, error)
	// Delete removes an object by key.
	Delete(ctx context.Context, bucket, key string) error
	// PresignedURL returns a time-limited URL for direct client download.
	PresignedURL(ctx context.Context, bucket, key string, expiry time.Duration) (string, error)
}
