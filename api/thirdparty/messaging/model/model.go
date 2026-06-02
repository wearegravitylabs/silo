// Package model defines messaging payload types.
package model

// EmailPayload is the data needed to send a transactional email.
type EmailPayload struct {
	To      string
	Subject string
	Body    string // HTML body
}
