import { createFileRoute, redirect } from '@tanstack/react-router'
import { VerifyEmailForm, type AuthIntent } from '@/features/auth'

export const Route = createFileRoute('/_auth/verify-email')({
  validateSearch: (search: Record<string, unknown>): { email: string; intent?: AuthIntent } => ({
    email: typeof search.email === 'string' ? search.email : '',
    ...((search.intent === 'sign-up' || search.intent === 'login') && { intent: search.intent }),
  }),
  // Only reachable after entering an email; send stragglers back to where they'd type one.
  beforeLoad: ({ search }) => {
    if (!search.email) throw redirect({ to: search.intent === 'login' ? '/login' : '/sign-up' })
  },
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { email, intent } = Route.useSearch()
  const navigate = Route.useNavigate()
  return <VerifyEmailForm email={email} intent={intent} onVerified={() => navigate({ to: '/onboarding/profile' })} />
}
