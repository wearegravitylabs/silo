// Package templates provides HTML email templates for Silo transactional emails.
package templates

import (
	"fmt"
	"time"
)

// OTPEmail returns a fully rendered HTML email body for a magic-link sign-in code.
// code is the plain-text 6-digit OTP shown to the user.
// expiry is the duration until the code expires, displayed in the email body.
func OTPEmail(code string, expiry time.Duration) string {
	mins := int(expiry.Minutes())
	expiryLabel := fmt.Sprintf("%d minutes", mins)

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="padding:48px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;padding:48px;border:1px solid #e4e4e7;">
        <tr>
          <td>
            <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#09090b;">
              Your Silo sign-in code
            </p>
            <p style="margin:0 0 32px;font-size:15px;color:#71717a;line-height:1.6;">
              Enter the code below to sign in to your account.<br>
              It expires in <strong>%s</strong>.
            </p>
            <div style="background:#f4f4f5;border-radius:8px;padding:24px;text-align:center;
                        font-size:48px;font-weight:800;letter-spacing:14px;color:#09090b;">
              %s
            </div>
            <p style="margin:32px 0 0;font-size:13px;color:#a1a1aa;line-height:1.5;">
              If you didn't request this code, you can safely ignore this email.<br>
              Someone may have entered your email address by mistake.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`, expiryLabel, code)
}
