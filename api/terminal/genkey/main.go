// Command genkey generates cryptographic keys for Silo configuration.
package main

import (
	"fmt"
	"os"

	"github.com/wearegravitylabs/silo/api/pkg/crypto"
)

func main() {
	encKey, err := crypto.GenerateRandomKey(32) // 256-bit AES key
	if err != nil {
		fmt.Fprintln(os.Stderr, "failed to generate encryption key:", err)
		os.Exit(1)
	}

	jwtSecret, err := crypto.GenerateRandomKey(32)
	if err != nil {
		fmt.Fprintln(os.Stderr, "failed to generate JWT secret:", err)
		os.Exit(1)
	}

	fmt.Println("# Add these to your .env file:")
	fmt.Printf("ENCRYPTION_KEY=%s\n", encKey)
	fmt.Printf("JWT_SIGNING_SECRET=%s\n", jwtSecret)
}
