// Package claude implements ai.AIProvider using the Anthropic Claude API.
package claude

import (
	"context"
	"fmt"

	"github.com/wearegravitylabs/silo/api/thirdparty/ai"
)

// Client calls the Anthropic Claude API.
type Client struct {
	apiKey string
	model  string
}

// New returns a Claude AI provider.
// model should be a valid Claude model ID, e.g. "claude-sonnet-4-6".
func New(apiKey, model string) ai.AIProvider {
	if model == "" {
		model = "claude-sonnet-4-6"
	}
	return &Client{apiKey: apiKey, model: model}
}

func (c *Client) Complete(ctx context.Context, systemPrompt, userMessage string) (string, error) {
	// TODO: implement Anthropic Messages API call
	// POST https://api.anthropic.com/v1/messages
	return "", fmt.Errorf("claude: Complete not yet implemented")
}

func (c *Client) Stream(ctx context.Context, systemPrompt, userMessage string) (<-chan string, error) {
	// TODO: implement streaming via server-sent events
	return nil, fmt.Errorf("claude: Stream not yet implemented")
}
