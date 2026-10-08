import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMe } from '@/features/account'
import { DashboardOverview, useDashboard, type DashboardPeriod } from '@/features/dashboard'
import { usePortfolio } from '@/features/portfolios'
import { MainPanel } from './-components/main-panel'
import { Topbar } from './-components/topbar'

export const Route = createFileRoute('/portfolio/$portfolioId/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { portfolioId } = Route.useParams()
  const navigate = Route.useNavigate()
  const portfolio = usePortfolio(portfolioId)
  const { data: me } = useMe()
  const [period, setPeriod] = useState<DashboardPeriod>('1M')
  const { data: dashboard } = useDashboard(portfolioId, period)

  return (
    <MainPanel scrollable>
      <Topbar portfolioId={portfolioId} lastSyncedAt={dashboard?.last_synced_at} />
      <DashboardOverview
        portfolioId={portfolioId}
        portfolioName={portfolio.name}
        firstName={me?.first_name}
        period={period}
        onPeriodChange={setPeriod}
        onAddAsset={() => navigate({ to: '/portfolio/$portfolioId/assets', params: { portfolioId }, search: { create: true } })}
      />
    </MainPanel>
  )
}
