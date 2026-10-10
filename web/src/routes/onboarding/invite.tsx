import { createFileRoute } from '@tanstack/react-router'
// import { redirect } from '@tanstack/react-router' // GUARD disabled
import { InviteStep } from '@/features/onboarding'
import { inviteLinkQuery } from '@/features/portfolios'

const PREVIEW_PORTFOLIO = 'demo' // the mock portfolio, so Continue still reaches a real dashboard while guards are disabled

export const Route = createFileRoute('/onboarding/invite')({
  // GUARD disabled for screen review — invites need a portfolio to invite into; without one, go create it.
  // beforeLoad: ({ search }) => {
  //   if (!search.portfolio) throw redirect({ to: '/onboarding/portfolio', search: (prev) => prev })
  // },
  loaderDeps: ({ search }) => ({ portfolio: search.portfolio ?? PREVIEW_PORTFOLIO }),
  loader: ({ context: { queryClient }, deps }) => queryClient.query({ ...inviteLinkQuery(deps.portfolio), staleTime: 'static' }),
  component: InvitePage,
})

function InvitePage() {
  const { portfolio } = Route.useSearch()
  const navigate = Route.useNavigate()
  const portfolioId = portfolio ?? PREVIEW_PORTFOLIO
  return (
    <InviteStep portfolioId={portfolioId} onDone={() => navigate({ to: '/portfolio/$portfolioId/dashboard', params: { portfolioId } })} />
  )
}
