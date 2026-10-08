import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { meQuery } from '@/features/account'
import { portfoliosQuery } from '@/features/portfolios'
import { AppShellSkeleton } from './-components/app-shell-skeleton'
import { Sidebar } from './-components/sidebar'

/** Signed-in shell for one portfolio: sidebar + the section page. */
export const Route = createFileRoute('/portfolio/$portfolioId')({
  loader: async ({ context: { queryClient }, params }) => {
    const [portfolios] = await Promise.all([queryClient.ensureQueryData(portfoliosQuery), queryClient.ensureQueryData(meQuery)])
    if (!portfolios.some((p) => p.id === params.portfolioId)) throw notFound()
  },
  pendingComponent: AppShellSkeleton,
  component: PortfolioLayout,
})

function PortfolioLayout() {
  const { portfolioId } = Route.useParams()
  return (
    <div className="flex min-h-dvh bg-surface">
      <Sidebar portfolioId={portfolioId} />
      <Outlet />
    </div>
  )
}
