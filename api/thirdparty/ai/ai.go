// Package ai defines the AI provider interface.
package ai

import "context"

//go:generate mockgen -source ai.go -destination ./mock/mock_ai.go -package mock AIProvider

// AIProvider is the interface for generating AI text completions.
type AIProvider interface {
	// Complete sends a single-turn prompt and returns the response text.
	Complete(ctx context.Context, systemPrompt, userMessage string) (string, error)
	// Stream sends a prompt and returns a channel of text tokens for streaming responses.
	Stream(ctx context.Context, systemPrompt, userMessage string) (<-chan string, error)
}
