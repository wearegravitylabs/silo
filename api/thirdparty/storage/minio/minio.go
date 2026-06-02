// Package minio implements storage.ObjectStorage using MinIO / S3-compatible storage.
package minio

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/wearegravitylabs/silo/api/thirdparty/storage"
)

// Client wraps the MinIO Go SDK.
type Client struct {
	endpoint  string
	accessKey string
	secretKey string
	useSSL    bool
}

// New returns an ObjectStorage backed by MinIO.
func New(endpoint, accessKey, secretKey string, useSSL bool) storage.ObjectStorage {
	return &Client{
		endpoint:  endpoint,
		accessKey: accessKey,
		secretKey: secretKey,
		useSSL:    useSSL,
	}
}

func (c *Client) Upload(ctx context.Context, bucket, key string, data io.Reader, size int64) (string, error) {
	// TODO: implement minio.Client.PutObject
	return "", fmt.Errorf("minio: Upload not yet implemented")
}

func (c *Client) Download(ctx context.Context, bucket, key string) (io.ReadCloser, error) {
	// TODO: implement minio.Client.GetObject
	return nil, fmt.Errorf("minio: Download not yet implemented")
}

func (c *Client) Delete(ctx context.Context, bucket, key string) error {
	// TODO: implement minio.Client.RemoveObject
	return fmt.Errorf("minio: Delete not yet implemented")
}

func (c *Client) PresignedURL(ctx context.Context, bucket, key string, expiry time.Duration) (string, error) {
	// TODO: implement minio.Client.PresignedGetObject
	return "", fmt.Errorf("minio: PresignedURL not yet implemented")
}
