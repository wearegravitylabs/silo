import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { FormHeading } from '@/components/form-field'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { OtpInput } from './otp-input'

const CODE_RE = /^\d{6}$/

export type AuthIntent = 'sign-up' | 'login'

const COPY = {
  'sign-up': { verb: 'sign up', back: 'Back to sign up', to: '/sign-up' },
  login: { verb: 'sign in', back: 'Back to log in', to: '/login' },
} as const

/** Magic-link screen, with a manual 6-digit code fallback. UI only: calls onVerified when Verify is clicked. */
export function VerifyEmailForm({ email, intent = 'sign-up', onVerified }: { email: string; intent?: AuthIntent; onVerified: () => void }) {
  const [step, setStep] = useState<'link' | 'code'>('link')
  const [code, setCode] = useState('')
  const filled = CODE_RE.test(code)
  const copy = COPY[intent]

  return (
    <div key={step} className="flex animate-fade-in-up flex-col items-center gap-6">
      <Logo />
      <FormHeading
        title="Check your Email"
        subtitle={
          <>
            We've sent you a temporary {copy.verb} {step === 'link' ? 'link' : 'code'}. Please check your inbox at{' '}
            <span className="text-foreground">{email}</span>
          </>
        }
      />

      {step === 'link' ? (
        <Button variant="secondary" size="lg" onClick={() => setStep('code')} className="w-full shadow-elevated">
          Enter code manually
        </Button>
      ) : (
        <>
          <OtpInput value={code} onChange={setCode} />
          <Button size="lg" disabled={!filled} onClick={onVerified} className="w-full">
            Verify email
          </Button>
        </>
      )}

      <Button variant="link" asChild>
        <Link to={copy.to}>{copy.back}</Link>
      </Button>
    </div>
  )
}
