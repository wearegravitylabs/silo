import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { meQuery, type User } from '@/features/account'
import { useSendCode, useVerifyCode, VerifyEmailForm, type AuthIntent } from '@/features/auth'

export const Route = createFileRoute('/_auth/verify-email')({
  validateSearch: (search: Record<string, unknown>): { email: string; intent?: AuthIntent; invite?: string } => ({
    email: typeof search.email === 'string' ? search.email : '',
    ...((search.intent === 'sign-up' || search.intent === 'login') && { intent: search.intent }),
    ...(typeof search.invite === 'string' && { invite: search.invite }),
  }),
  // Only reachable after entering an email; send stragglers back to where they'd type one.
  beforeLoad: ({ search }) => {
    if (!search.email) throw redirect({ to: search.intent === 'login' ? '/login' : '/sign-up' })
  },
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { email, intent, invite } = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const sendCode = useSendCode()
  const verifyCode = useVerifyCode<User>()

  return (
    <VerifyEmailForm
      email={email}
      intent={intent}
      onResend={async () => {
        await sendCode.mutateAsync(email)
      }}
      onVerify={async (code) => {
        const user = await verifyCode.mutateAsync({ email, code })
        queryClient.setQueryData(meQuery.queryKey, user)
        await (user.is_onboarded ? navigate({ to: '/' }) : navigate({ to: '/onboarding', search: { invite } }))
      }}
    />
  )
}
