import { createFileRoute, redirect } from '@tanstack/react-router'
import { portfoliosQuery } from '@/features/portfolios'
import { AppShellSkeleton } from './p/$portfolioId/-components/app-shell-skeleton'

/** `/` → the first portfolio's dashboard, or onboarding when there are none. */
export const Route = createFileRoute('/')({
  pendingComponent: AppShellSkeleton,
  loader: async ({ context: { queryClient } }) => {
    const [first] = await queryClient.ensureQueryData(portfoliosQuery)
    if (!first) throw redirect({ to: '/onboarding/portfolio' })
    throw redirect({ to: '/p/$portfolioId/dashboard', params: { portfolioId: first.id } })
  },
})
