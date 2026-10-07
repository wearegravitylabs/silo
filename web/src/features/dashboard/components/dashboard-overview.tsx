import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'
import { useDashboard } from '../queries'
import type { DashboardPeriod } from '../types'
import { AllocationCard } from './allocation-card'
import { DashboardSkeleton } from './dashboard-skeleton'
import { EmptyState } from './empty-state'
import { TrendingDownIcon, TrendingUpIcon } from './icons'
import { LiabilitiesCard } from './liabilities-card'
import { MoversCard } from './movers-card'
import { NetWorthCard } from './net-worth-card'
import { QuickActionsMenu } from './quick-actions-menu'

/** Dashboard body for one portfolio: header, net worth, allocation, movers, liabilities. */
export function DashboardOverview({
  portfolioId,
  portfolioName,
  period,
  onPeriodChange,
  onAddAsset,
}: {
  portfolioId: string
  portfolioName: string
  period: DashboardPeriod
  onPeriodChange: (period: DashboardPeriod) => void
  onAddAsset: () => void
}) {
  const { data: dashboard, isPlaceholderData } = useDashboard(portfolioId, period)
  if (!dashboard) return <DashboardSkeleton />

  const title = <h1 className="font-heading text-xl leading-7 font-bold">{portfolioName}</h1>
  const actions = <QuickActionsMenu onAddAsset={onAddAsset} />

  if (dashboard.data_status === 'empty') {
    return (
      <>
        <PageHeader eyebrow="Portfolio" title={title} actions={actions} />
        <EmptyState portfolioName={portfolioName} onAddAsset={onAddAsset} />
      </>
    )
  }

  const { net_worth: nw } = dashboard
  return (
    <div className="flex flex-1 animate-fade-in-up flex-col pb-10">
      <PageHeader
        eyebrow="Portfolio"
        className="pb-5"
        actions={actions}
        title={
          <div className="flex items-center gap-2">
            {title}
            {dashboard.data_status === 'insufficient_history' && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
                <span className="size-1.25 rounded-full bg-amber-500" />
                No history for this period
              </span>
            )}
          </div>
        }
      />

      {/* Dim while a new period loads; the previous period stays visible */}
      <div className={cn('flex flex-col gap-4 px-10 transition-opacity', isPlaceholderData && 'opacity-60')} aria-busy={isPlaceholderData}>
        <NetWorthCard nw={nw} chartPoints={dashboard.chart.points} period={period} onPeriod={onPeriodChange} />
        <AllocationCard allocation={dashboard.allocation} currency={nw.currency} />
        <div className="flex gap-4">
          <MoversCard
            title="Top Gainers"
            icon={<TrendingUpIcon />}
            movers={dashboard.top_movers.gainers}
            currency={nw.currency}
            emptyMsg="No gainers in this period"
          />
          <MoversCard
            title="Top Losers"
            icon={<TrendingDownIcon />}
            movers={dashboard.top_movers.losers}
            currency={nw.currency}
            emptyMsg="No losers in this period"
          />
        </div>
        <LiabilitiesCard debts={dashboard.debts} nw={nw} />
      </div>
    </div>
  )
}
