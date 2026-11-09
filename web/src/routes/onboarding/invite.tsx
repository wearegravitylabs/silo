import { createFileRoute, redirect } from '@tanstack/react-router'
import { InviteStep } from '@/features/onboarding'
import { inviteLinkQuery } from '@/features/portfolios'

// TODO: the invite link is still mocked (see getInviteLink); the backend has no invite-link endpoints yet.
export const Route = createFileRoute('/onboarding/invite')({
  // Invites need a portfolio to invite into; without one, go create it.
  beforeLoad: ({ search }) => {
    if (!search.portfolio) throw redirect({ to: '/onboarding/portfolio', search: (prev) => prev })
  },
  loaderDeps: ({ search }) => ({ portfolio: search.portfolio! }),
  loader: ({ context: { queryClient }, deps }) => queryClient.query({ ...inviteLinkQuery(deps.portfolio), staleTime: 'static' }),
  component: InvitePage,
})

function InvitePage() {
  const { portfolio } = Route.useSearch()
  const navigate = Route.useNavigate()
  const portfolioId = portfolio!
  return (
    <InviteStep
      portfolioId={portfolioId}
      onDone={() => navigate({ to: '/portfolio/$portfolioId/dashboard', params: { portfolioId }, search: { welcome: true } })}
    />
  )
}
