import { useNavigate } from '@tanstack/react-router'
import { VerifyEmailForm } from '@/features/auth'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  return (
    <VerifyEmailForm
      onVerified={(user) => navigate({ to: user.is_onboarded ? '/dashboard' : '/onboarding/profile' })}
    />
  )
}
