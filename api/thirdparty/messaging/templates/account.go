package templates

import (
	"fmt"
	"html"
	"time"
)

// page wraps a title, an intro paragraph, a highlighted block and a footer
// note in the same layout as OTPEmail. block is already-safe HTML.
func page(title, intro, block, note string) string {
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
            <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#09090b;">%s</p>
            <p style="margin:0 0 32px;font-size:15px;color:#71717a;line-height:1.6;">%s</p>
            %s
            <p style="margin:32px 0 0;font-size:13px;color:#a1a1aa;line-height:1.5;">%s</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`, html.EscapeString(title), intro, block, note)
}

func codeBlock(code string) string {
	return `<div style="background:#f4f4f5;border-radius:8px;padding:24px;text-align:center;
                font-size:48px;font-weight:800;letter-spacing:14px;color:#09090b;">` + html.EscapeString(code) + `</div>`
}

func buttonBlock(label, link string) string {
	return fmt.Sprintf(`<a href="%s" style="display:inline-block;background:#09090b;color:#ffffff;text-decoration:none;
                padding:14px 24px;border-radius:8px;font-weight:600;font-size:15px;">%s</a>
            <p style="margin:16px 0 0;font-size:12px;color:#a1a1aa;word-break:break-all;">%s</p>`,
		html.EscapeString(link), html.EscapeString(label), html.EscapeString(link))
}

// ConfirmActionEmail asks the user to confirm a risky action with a code.
// action reads in a sentence, e.g. "delete your Silo account".
func ConfirmActionEmail(action, code string, expiry time.Duration) string {
	return page("Confirm it's you",
		fmt.Sprintf("Enter this code in Silo to %s.<br>It expires in <strong>%d minutes</strong>.",
			html.EscapeString(action), int(expiry.Minutes())),
		codeBlock(code),
		"If you didn't ask for this, don't share the code with anyone, and consider signing out of your other devices.")
}

// ConfirmEmailChangeEmail is sent to the new address with the link that
// completes the change.
func ConfirmEmailChangeEmail(link string, expiry time.Duration) string {
	return page("Confirm your new email",
		fmt.Sprintf("Click the button to use this address for your Silo account.<br>The link expires in <strong>%d hours</strong>.",
			int(expiry.Hours())),
		buttonBlock("Confirm email", link),
		"If you didn't ask to change your Silo email, ignore this message and nothing will change.")
}

// EmailChangedNotice is sent to the old address after the change.
func EmailChangedNotice(newEmail string) string {
	return page("Your Silo email was changed",
		fmt.Sprintf("Your account now uses <strong>%s</strong>. You'll sign in with that address from now on.",
			html.EscapeString(newEmail)),
		"",
		"If you didn't make this change, contact support straight away.")
}

// InviteEmail invites someone to a portfolio. link opens the app's invites page.
func InviteEmail(inviter, portfolio, role, link string) string {
	return page("You're invited to a Silo portfolio",
		fmt.Sprintf("<strong>%s</strong> invited you to <strong>%s</strong> as %s. Open Silo to accept — if you're new, you'll sign up first with this email.",
			html.EscapeString(inviter), html.EscapeString(portfolio), html.EscapeString(roleLabel(role))),
		buttonBlock("View invite", link),
		"If you weren't expecting this, you can ignore it; nothing happens until you accept.")
}

// AccessRequestEmail tells an owner someone asked to join through the invite link.
func AccessRequestEmail(requester, portfolio, link string) string {
	return page("Someone asked to join your portfolio",
		fmt.Sprintf("<strong>%s</strong> opened your invite link to <strong>%s</strong> and asked to join. Approve or decline in Silo.",
			html.EscapeString(requester), html.EscapeString(portfolio)),
		buttonBlock("Review request", link),
		"Only people you approve can see the portfolio. You can turn the invite link off at any time.")
}

// AccessApprovedEmail tells someone their request to join was approved.
func AccessApprovedEmail(portfolio, link string) string {
	return page("You're in",
		fmt.Sprintf("Your request to join <strong>%s</strong> was approved.", html.EscapeString(portfolio)),
		buttonBlock("Open Silo", link),
		"")
}

// roleLabel is how a role reads to people: the app calls editors partners.
func roleLabel(role string) string {
	switch role {
	case "owner":
		return "an owner"
	case "editor":
		return "a partner"
	}
	return "a viewer"
}
