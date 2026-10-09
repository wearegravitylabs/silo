import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { meQuery, useMe } from '@/features/account'
import { portfoliosQuery } from '@/features/portfolios'
import { SiloAiPanel } from '@/features/silo-ai'
import { AppShellSkeleton } from './-components/app-shell-skeleton'
import { MainPanel } from './-components/main-panel'
import { Sidebar } from './-components/sidebar'
import { Topbar } from './-components/topbar'

/**
 * Signed-in app shell for one portfolio — the place features are combined:
 * sidebar | [topbar / (page + Silo AI panel)]. Pages render only their own content and scroll inside it.
 */
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
  const { data: me } = useMe()
  return (
    <div className="flex min-h-dvh bg-surface">
      <Sidebar portfolioId={portfolioId} />
      <MainPanel>
        <Topbar portfolioId={portfolioId} />
        <div className="flex min-h-0 flex-1">
          <div className="relative flex min-w-0 flex-1 flex-col">
            <Outlet />
          </div>
          <SiloAiPanel firstName={me?.first_name} />
        </div>
      </MainPanel>
    </div>
  )
}
