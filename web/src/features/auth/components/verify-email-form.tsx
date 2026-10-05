import { useEffect, useState } from 'react'
import { FormHeading } from '@/components/form-field'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { OtpInput } from './otp-input'

const RESEND_COOLDOWN = 60
const CODE_RE = /^\d{6}$/

/** OTP step. UI only: calls onVerified once a full 6-digit code is entered. */
export function VerifyEmailForm({ email, onVerified }: { email?: string; onVerified: () => void }) {
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)
  const filled = CODE_RE.test(code)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const handleCodeChange = (value: string) => {
    setCode(value)
    if (CODE_RE.test(value)) onVerified() // auto-submit on the 6th digit
  }

  return (
    <div className="flex animate-fade-in-up flex-col items-center gap-6">
      <Logo />
      <FormHeading
        title="Check your Email"
        subtitle={
          <>
            We've sent you a temporary sign in code. Please check your inbox at{' '}
            <span className="font-semibold text-foreground">{email ?? 'your email'}</span>
          </>
        }
      />

      <OtpInput value={code} onChange={handleCodeChange} />

      <div className="flex w-full flex-col gap-3">
        <Button size="lg" disabled={!filled} onClick={onVerified} className="w-full">
          Verify email
        </Button>
        <Button
          variant="link"
          size="lg"
          disabled={cooldown > 0}
          onClick={() => {
            setCode('')
            setCooldown(RESEND_COOLDOWN)
          }}
          className="h-10 w-full disabled:text-muted-foreground disabled:opacity-40"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </Button>
      </div>
    </div>
  )
}
