import { useState, type ReactNode } from 'react'
import { FormField, FormHeading } from '@/components/form-field'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Email-only sign-in/sign-up form. UI only: validates, then hands the email to onSubmit. */
export function EmailAuthForm({
  title,
  subtitle,
  footer,
  onSubmit,
}: {
  title: string
  subtitle: string
  footer: ReactNode
  onSubmit: (email: string) => void | Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [pending, setPending] = useState(false)
  const emailError = touched && !EMAIL_RE.test(email) ? 'Enter a valid email address' : undefined

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTouched(true)
    if (pending || !EMAIL_RE.test(email)) return
    setPending(true)
    try {
      await onSubmit(email)
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-center gap-6">
        <Logo />
        <FormHeading title={title} subtitle={subtitle} />
      </div>

      {/* Social sign-in: Silo Cloud only */}
      <div className="mb-4 flex flex-col gap-3">
        <SocialButton icon={<GoogleIcon />} label="Continue with Google" />
        <SocialButton icon={<AppleIcon />} label="Continue with Apple ID" />
      </div>

      <div className="mb-5 flex items-center gap-2 text-muted-foreground" role="separator">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label="Email Address" htmlFor="email" error={emailError}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            readOnly={pending}
            placeholder="john.doe@yahoo.com"
            aria-invalid={!!emailError || undefined}
          />
        </FormField>
        <Button type="submit" size="lg" loading={pending} loadingText="Sending link…" className="w-full">
          Continue with Email
        </Button>
      </form>

      {footer}
    </div>
  )
}

function SocialButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Button variant="secondary" size="lg" title="Available in Silo Cloud" className="w-full gap-2 font-semibold shadow-elevated">
      {icon}
      {label}
    </Button>
  )
}

/* Brand marks keep their official colours. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className="size-4">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.253 17.64 11.945 17.64 9.2z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 8C15 11.864 11.8675 15 8 15C4.1325 15 1 11.864 1 8C1 4.1325 4.1325 1 8 1C11.8675 1 15 4.1325 15 8Z" fill="#283544" />
      <path
        d="M11.2811 6.22869C11.2429 6.25098 10.3335 6.72124 10.3335 7.76393C10.3764 8.95305 11.4811 9.37006 11.5 9.37006C11.4811 9.39235 11.3332 9.93814 10.8953 10.5103C10.5478 11.0031 10.1621 11.5 9.57639 11.5C9.01925 11.5 8.81925 11.1715 8.17639 11.1715C7.48601 11.1715 7.29067 11.5 6.7621 11.5C6.17638 11.5 5.7621 10.9765 5.39564 10.4883C4.91955 9.8493 4.51489 8.84655 4.5006 7.88374C4.49098 7.37353 4.59594 6.87202 4.86241 6.44603C5.23849 5.85132 5.90992 5.44762 6.64316 5.43431C7.20496 5.41665 7.70496 5.79373 8.04782 5.79373C8.37639 5.79373 8.99068 5.43431 9.68571 5.43431C9.98571 5.4346 10.7857 5.51881 11.2811 6.22869ZM8.0003 5.33244C7.9003 4.86652 8.17639 4.40059 8.43353 4.10339C8.7621 3.74396 9.28105 3.5 9.72857 3.5C9.75714 3.96592 9.57608 4.42288 9.25248 4.75568C8.96211 5.11511 8.4621 5.38569 8.0003 5.33244Z"
        fill="white"
      />
    </svg>
  )
}
