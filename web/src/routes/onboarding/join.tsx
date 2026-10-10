import { createFileRoute } from '@tanstack/react-router'
// import { redirect } from '@tanstack/react-router' // GUARD disabled
import { JoinPortfolioStep, nextStep } from '@/features/onboarding'
import { inviteQuery } from '@/features/portfolios'
import { STEP_PATH } from './-steps'

const PREVIEW_INVITE = 'preview' // stands in while guards are disabled

export const Route = createFileRoute('/onboarding/join')({
  // GUARD disabled for screen review — only the invited flow has this step.
  // beforeLoad: ({ search }) => {
  //   if (!search.invite) throw redirect({ to: '/onboarding' })
  // },
  loaderDeps: ({ search }) => ({ invite: search.invite ?? PREVIEW_INVITE }),
  loader: ({ context: { queryClient }, deps }) => queryClient.query({ ...inviteQuery(deps.invite), staleTime: 'static' }),
  component: JoinPage,
})

function JoinPage() {
  const { invite } = Route.useSearch()
  const navigate = Route.useNavigate()
  const next = nextStep('invited', 'join')!
  const token = invite ?? PREVIEW_INVITE
  // Carry the token on so the next steps stay in the invited flow, even when previewing without one.
  return (
    <JoinPortfolioStep
      token={token}
      onRequested={() => navigate({ to: STEP_PATH[next], search: (prev) => ({ ...prev, invite: token }) })}
    />
  )
}
