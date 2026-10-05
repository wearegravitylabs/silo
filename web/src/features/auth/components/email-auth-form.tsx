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
  onSubmit: (email: string) => void
}) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const emailError = touched && !EMAIL_RE.test(email) ? 'Enter a valid email address' : undefined

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (EMAIL_RE.test(email)) onSubmit(email)
  }

  return (
    <>
      <div className="mb-6 flex flex-col items-center gap-6">
        <Logo />
        <FormHeading title={title} subtitle={subtitle} />
      </div>

      {/* Social sign-in: Silo Cloud only */}
      <div className="mb-5 flex flex-col gap-3">
        <SocialButton icon={<GoogleIcon />} label="Continue with Google" />
        <SocialButton icon={<AppleIcon />} label="Continue with Apple ID" />
      </div>

      <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground" role="separator">
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
            placeholder="john.doe@yahoo.com"
            aria-invalid={!!emailError || undefined}
          />
        </FormField>
        <Button type="submit" size="lg" className="w-full">
          Continue with Email
        </Button>
      </form>

      {footer}
    </>
  )
}

function SocialButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Button variant="secondary" size="lg" disabled title="Available in Silo Cloud" className="w-full gap-2 shadow-elevated">
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
    <svg viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true" className="size-4">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-54.3-155.5-127.4C46.7 790.7 0 663 0 541.8c0-207.5 135.4-317.3 268.5-317.3 71 0 130.1 46.4 173.4 46.4 42.6 0 109.5-49.8 190.8-49.8zM520 188.9c-7.4-41.1 15.4-81.9 37.9-107.8C584.2 47.8 629.7 20 672.6 20c2.3 0 4.7 0 6.9.2-2.5 41.1-19.4 81.7-45 111.3-23.3 27.4-66.6 56.4-114.5 57.4z" />
    </svg>
  )
}
