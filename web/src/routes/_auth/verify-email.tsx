import { createFileRoute } from '@tanstack/react-router'
import { VerifyEmailForm } from '@/features/auth'

export const Route = createFileRoute('/_auth/verify-email')({
  validateSearch: (search: Record<string, unknown>): { email?: string } =>
    typeof search.email === 'string' ? { email: search.email } : {},
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { email } = Route.useSearch()
  const navigate = Route.useNavigate()
  return <VerifyEmailForm email={email} onVerified={() => navigate({ to: '/onboarding/profile' })} />
}
