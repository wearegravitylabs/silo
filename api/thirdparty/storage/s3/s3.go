// Package s3 implements storage.ObjectStorage using the AWS S3 protocol.
//
// All three supported providers (AWS S3, Cloudflare R2, MinIO) speak the same
// S3 protocol — only the endpoint and path-style configuration differ.
package s3

import (
	"context"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// Config carries the provider-specific settings.
//
// AWS S3:         Endpoint="", Region="us-east-1",   ForcePathStyle=false
// Cloudflare R2:  Endpoint="https://<account>.r2.cloudflarestorage.com", Region="auto"
// MinIO:          Endpoint="http://localhost:9000",   ForcePathStyle=true
type Config struct {
	Endpoint       string
	AccessKey      string
	SecretKey      string
	Bucket         string
	Region         string
	ForcePathStyle bool
	// PublicURL is the base URL used to construct public download links.
	// e.g. "https://pub-xxx.r2.dev" for R2, "https://bucket.s3.amazonaws.com" for S3,
	// "http://localhost:9000/silo" for MinIO.
	PublicURL string
}

// Client wraps the AWS SDK v2 S3 client.
type Client struct {
	s3     *s3.Client
	bucket string
	pubURL string
}

// New creates a *Client for the given configuration.
// *Client satisfies storage.ObjectStorage via structural typing — no explicit import needed.
func New(ctx context.Context, cfg Config) (*Client, error) {
	creds := credentials.NewStaticCredentialsProvider(cfg.AccessKey, cfg.SecretKey, "")

	opts := []func(*config.LoadOptions) error{
		config.WithRegion(cfg.Region),
		config.WithCredentialsProvider(creds),
	}

	awsCfg, err := config.LoadDefaultConfig(ctx, opts...)
	if err != nil {
		return nil, fmt.Errorf("s3: failed to load config: %w", err)
	}

	clientOpts := []func(*s3.Options){
		func(o *s3.Options) {
			o.UsePathStyle = cfg.ForcePathStyle
		},
	}
	if cfg.Endpoint != "" {
		clientOpts = append(clientOpts, func(o *s3.Options) {
			o.BaseEndpoint = aws.String(cfg.Endpoint)
		})
	}

	client := s3.NewFromConfig(awsCfg, clientOpts...)

	return &Client{
		s3:     client,
		bucket: cfg.Bucket,
		pubURL: strings.TrimRight(cfg.PublicURL, "/"),
	}, nil
}

// Upload stores data at the given key and returns the public URL.
func (c *Client) Upload(ctx context.Context, bucket, key string, data io.Reader, size int64) (string, error) {
	if bucket == "" {
		bucket = c.bucket
	}

	_, err := c.s3.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(bucket),
		Key:           aws.String(key),
		Body:          data,
		ContentLength: aws.Int64(size),
		ACL:           types.ObjectCannedACLPublicRead,
	})
	if err != nil {
		return "", fmt.Errorf("s3: upload %s: %w", key, err)
	}

	return c.publicURL(bucket, key), nil
}

// Download retrieves an object by key.
func (c *Client) Download(ctx context.Context, bucket, key string) (io.ReadCloser, error) {
	if bucket == "" {
		bucket = c.bucket
	}

	out, err := c.s3.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("s3: download %s: %w", key, err)
	}
	return out.Body, nil
}

// Delete removes an object by key.
func (c *Client) Delete(ctx context.Context, bucket, key string) error {
	if bucket == "" {
		bucket = c.bucket
	}

	_, err := c.s3.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("s3: delete %s: %w", key, err)
	}
	return nil
}

// PresignedURL returns a time-limited URL for direct client download.
func (c *Client) PresignedURL(ctx context.Context, bucket, key string, expiry time.Duration) (string, error) {
	if bucket == "" {
		bucket = c.bucket
	}

	presigner := s3.NewPresignClient(c.s3)
	req, err := presigner.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expiry))
	if err != nil {
		return "", fmt.Errorf("s3: presign %s: %w", key, err)
	}
	return req.URL, nil
}

// publicURL constructs the public download URL for a key.
func (c *Client) publicURL(bucket, key string) string {
	if c.pubURL != "" {
		return c.pubURL + "/" + key
	}
	// Default AWS S3 path-style fallback.
	return fmt.Sprintf("https://%s.s3.amazonaws.com/%s", bucket, key)
}
