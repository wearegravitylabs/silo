import { PageHeader } from '@/components/page-header'
import { useDashboard } from '../../queries'
import type { DashboardPeriod } from '../../types'
import { AiInsightsCard } from '../cards/ai-insights-card'
import { AllocationCard } from '../cards/allocation-card'
import { DashboardSkeleton } from './dashboard-skeleton'
import { DebtCard } from '../cards/debt-card'
import { MoversCard } from '../cards/movers-card'
import { NetWorthCard } from '../cards/net-worth-card'
import { QuickActionsMenu } from './quick-actions-menu'

/**
 * Dashboard body for one portfolio: header, net worth + AI insights, allocation, movers, debt.
 * A portfolio with no data renders the same layout; each card shows its own zero/placeholder state.
 */
export function DashboardOverview({
  portfolioId,
  portfolioName,
  firstName,
  period,
  onPeriodChange,
  onAddAsset,
  onTalkToAi,
}: {
  portfolioId: string
  portfolioName: string
  firstName?: string
  period: DashboardPeriod
  onPeriodChange: (period: DashboardPeriod) => void
  onAddAsset: () => void
  onTalkToAi: () => void
}) {
  const { data: dashboard } = useDashboard(portfolioId, period)
  if (!dashboard) return <DashboardSkeleton />

  const title = <h1 className="truncate text-xl leading-7">{firstName ? `Welcome ${firstName}` : 'Welcome'}</h1>
  const actions = <QuickActionsMenu onAddAsset={onAddAsset} />

  const { net_worth: nw } = dashboard
  return (
    <div className="@container flex flex-1 animate-fade-in-up flex-col pb-10">
      <PageHeader eyebrow={portfolioName} className="pb-5" actions={actions} title={title} />
      <div className="flex flex-col gap-4 px-4">
        {/* Net worth + AI insights: one 404px (25.25rem) row on desktop */}
        <div className="flex flex-col gap-4 @4xl:h-101 @4xl:flex-row">
          <NetWorthCard
            nw={nw}
            chartPoints={dashboard.chart.points}
            period={period}
            onPeriod={onPeriodChange}
            className="min-w-0 @4xl:flex-1"
          />
          <AiInsightsCard insights={dashboard.insights} onTalkToAi={onTalkToAi} className="h-101 shrink-0 @4xl:h-auto @4xl:w-79" />
        </div>
        <AllocationCard portfolioId={portfolioId} allocation={dashboard.allocation} />
        <div className="flex flex-col gap-4 @2xl:flex-row">
          <MoversCard kind="gainers" movers={dashboard.top_movers.gainers} />
          <MoversCard kind="losers" movers={dashboard.top_movers.losers} />
        </div>
        <DebtCard portfolioId={portfolioId} debts={dashboard.debts} />
      </div>
    </div>
  )
}
