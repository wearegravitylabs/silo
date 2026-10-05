import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  dashboardQuery,
  DashboardOverview,
  DashboardSkeleton,
  isDashboardPeriod,
  useDashboard,
  WelcomeModal,
  type DashboardPeriod,
} from '@/features/dashboard'
import { usePortfolio } from '@/features/portfolios'
import { MainPanel } from './-components/main-panel'
import { Topbar } from './-components/topbar'

const DEFAULT_PERIOD: DashboardPeriod = '1M'
const WELCOME_KEY = 'silo:welcome-shown'

export const Route = createFileRoute('/p/$portfolioId/dashboard')({
  // ?period=1W|1M|3M|6M|1Y; omitted means the default
  validateSearch: (search: Record<string, unknown>): { period?: DashboardPeriod } =>
    isDashboardPeriod(search.period) ? { period: search.period } : {},
  // Reads search from location (not loaderDeps) so a period switch re-uses the page
  // instead of showing the skeleton; the component keeps the previous period visible.
  loader: ({ context: { queryClient }, params, location }) => {
    const { period } = location.search as { period?: unknown }
    return queryClient.ensureQueryData(dashboardQuery(params.portfolioId, isDashboardPeriod(period) ? period : DEFAULT_PERIOD))
  },
  pendingComponent: () => (
    <DashboardShell>
      <DashboardSkeleton />
    </DashboardShell>
  ),
  component: DashboardPage,
})

function DashboardShell({ lastSyncedAt, children }: { lastSyncedAt?: string; children: React.ReactNode }) {
  const { portfolioId } = Route.useParams()
  return (
    <MainPanel scrollable>
      <Topbar portfolioId={portfolioId} lastSyncedAt={lastSyncedAt} actionLabel="Invite" />
      {children}
    </MainPanel>
  )
}

function DashboardPage() {
  const { portfolioId } = Route.useParams()
  const { period = DEFAULT_PERIOD } = Route.useSearch()
  const navigate = Route.useNavigate()
  const portfolio = usePortfolio(portfolioId)
  const { data: dashboard } = useDashboard(portfolioId, period)
  const [welcome, setWelcome] = useState(() => !readFlag(WELCOME_KEY))

  return (
    <DashboardShell lastSyncedAt={dashboard?.last_synced_at}>
      <DashboardOverview
        portfolioId={portfolioId}
        portfolioName={portfolio.name}
        period={period}
        onPeriodChange={(p) => navigate({ search: p === DEFAULT_PERIOD ? {} : { period: p }, replace: true })}
        onAddAsset={() => navigate({ to: '/p/$portfolioId/assets', params: { portfolioId }, search: { create: true } })}
      />
      <WelcomeModal
        open={welcome}
        onOpenChange={(open) => {
          setWelcome(open)
          if (!open) writeFlag(WELCOME_KEY)
        }}
      />
    </DashboardShell>
  )
}

// localStorage can throw (private mode, blocked storage); a missing flag just shows the welcome again.
function readFlag(key: string) {
  try {
    return localStorage.getItem(key) !== null
  } catch {
    return false
  }
}
function writeFlag(key: string) {
  try {
    localStorage.setItem(key, '1')
  } catch {
    /* ignore */
  }
}
