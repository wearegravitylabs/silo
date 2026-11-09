import { createFileRoute, redirect } from '@tanstack/react-router'
import { isDemoPortfolio, portfoliosQuery } from '@/features/portfolios'
import { requireUser } from '@/routes/-guards'
import { AppShellError, AppShellSkeleton } from './portfolio/$portfolioId/-components/app-shell-skeleton'

/** `/` → the first portfolio's dashboard, or onboarding when there are none. */
export const Route = createFileRoute('/')({
  beforeLoad: ({ context: { queryClient } }) => requireUser(queryClient, { onboarded: true }),
  pendingComponent: AppShellSkeleton,
  errorComponent: AppShellError,
  loader: async ({ context: { queryClient } }) => {
    // Skip the dev-only demo portfolios: someone with no portfolio of their own still goes to create one.
    const first = (await queryClient.query({ ...portfoliosQuery, staleTime: 'static' })).find((p) => !isDemoPortfolio(p.id))
    if (!first) throw redirect({ to: '/onboarding/portfolio' })
    throw redirect({ to: '/portfolio/$portfolioId/dashboard', params: { portfolioId: first.id } })
  },
})
