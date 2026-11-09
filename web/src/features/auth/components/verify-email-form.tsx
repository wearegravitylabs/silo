import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { FieldError } from '@/components/field-error'
import { FormHeading } from '@/components/form-field'
import { Logo } from '@/components/logo'
import { OtpInput } from '@/components/otp-input'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/api-client'

const CODE_RE = /^\d{6}$/

export type AuthIntent = 'sign-up' | 'login'

const COPY = {
  'sign-up': { verb: 'sign up', back: 'Back to sign up', to: '/sign-up' },
  login: { verb: 'sign in', back: 'Back to log in', to: '/login' },
} as const

/** 6-digit code screen. Verify and resend failures show here; what happens after a valid code is up to onVerify. */
export function VerifyEmailForm({
  email,
  intent = 'sign-up',
  onVerify,
  onResend,
}: {
  email: string
  intent?: AuthIntent
  onVerify: (code: string) => Promise<void>
  onResend: () => Promise<void>
}) {
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string>()
  const filled = CODE_RE.test(code)
  const copy = COPY[intent]

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pending || !filled) return
    setPending(true)
    try {
      await onVerify(code)
    } catch (err) {
      setError(getErrorMessage(err, 'That code didn’t work. Check your email and try again.'))
    } finally {
      setPending(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await onResend()
      setCode('')
      setError(undefined)
      toast.success('We’ve sent you a new code')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Couldn’t send a new code. Try again.'))
    } finally {
      setResending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6" noValidate>
      <Logo />
      <FormHeading
        title="Check your Email"
        subtitle={
          <>
            We've sent you a temporary {copy.verb} code. Please check your inbox at <span className="text-foreground">{email}</span>
          </>
        }
      />

      <div className="flex w-full flex-col items-center">
        <OtpInput
          value={code}
          onChange={(value) => {
            setCode(value)
            setError(undefined)
          }}
          hasError={!!error}
        />
        {error && <FieldError message={error} />}
      </div>
      <Button type="submit" size="lg" disabled={!filled} loading={pending} loadingText="Verifying…" className="w-full">
        Verify email
      </Button>

      <div className="flex flex-col items-center gap-1">
        <Button variant="link" onClick={handleResend} loading={resending} loadingText="Sending…" disabled={pending}>
          Resend code
        </Button>
        <Button variant="link" asChild>
          <Link to={copy.to}>{copy.back}</Link>
        </Button>
      </div>
    </form>
  )
}
