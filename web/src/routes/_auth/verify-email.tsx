import { createFileRoute } from '@tanstack/react-router'
// import { redirect } from '@tanstack/react-router' // GUARD disabled
import { VerifyEmailForm, type AuthIntent } from '@/features/auth'

export const Route = createFileRoute('/_auth/verify-email')({
  validateSearch: (search: Record<string, unknown>): { email: string; intent?: AuthIntent; invite?: string } => ({
    email: typeof search.email === 'string' ? search.email : '',
    ...((search.intent === 'sign-up' || search.intent === 'login') && { intent: search.intent }),
    ...(typeof search.invite === 'string' && { invite: search.invite }),
  }),
  // GUARD disabled for screen review — only reachable after entering an email; send stragglers back to where they'd type one.
  // beforeLoad: ({ search }) => {
  //   if (!search.email) throw redirect({ to: search.intent === 'login' ? '/login' : '/sign-up' })
  // },
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { email, intent, invite } = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <VerifyEmailForm
      email={email || 'john.doe@yahoo.com' /* preview placeholder */}
      intent={intent}
      onVerified={() => navigate({ to: '/onboarding', search: { invite } })}
    />
  )
}
