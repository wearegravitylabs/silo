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
  const { data: dashboard, isLoading } = useDashboard(portfolioId, period)

  return isLoading ? (
    <DashboardSkeleton />
  ) : dashboard?.data_status === 'empty' || !dashboard ? (
    <>
      {/* Section heading even in empty state */}
      <div className="flex items-end justify-between" style={{ padding: '28px 40px 0' }}>
        <div className="flex flex-col gap-1">
          <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', color: '#6E738C' }}>Portfolio</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: '#2C2E35' }}>
            {portfolioName}
          </span>
        </div>
        <QuickActionsMenu onAddAsset={onAddAsset} />
      </div>
      <EmptyState portfolioName={portfolioName} onAddAsset={onAddAsset} />
    </>
  ) : (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '40px', animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
      {/* Section header */}
      <div className="flex items-end justify-between" style={{ padding: '28px 40px 20px' }}>
        <div className="flex flex-col gap-1">
          <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', color: '#6E738C' }}>Portfolio</span>
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, lineHeight: '28px', color: '#2C2E35' }}>
              {portfolioName}
            </span>
            {/* Insufficient history badge */}
            {dashboard.data_status === 'insufficient_history' && (
              <div className="flex items-center gap-1.5" style={{ padding: '2px 8px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '20px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: '#92400E', fontWeight: 500 }}>No history for this period</span>
              </div>
            )}
          </div>
        </div>
        <QuickActionsMenu onAddAsset={onAddAsset} />
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 40px' }}>
        {/* Net worth */}
        <NetWorthCard
          nw={dashboard.net_worth}
          chartPoints={dashboard.chart.points}
          period={period}
          onPeriod={onPeriodChange}
        />

        {/* Allocation */}
        <AllocationCard
          allocation={dashboard.allocation}
          currency={dashboard.net_worth.currency}
        />

        {/* Movers row */}
        <div className="flex gap-4">
          <MoversCard
            title="Top Gainers"
            icon={<TrendingUpIcon color="#29AF0B" />}
            movers={dashboard.top_movers.gainers}
            currency={dashboard.net_worth.currency}
            emptyMsg="No gainers in this period"
          />
          <MoversCard
            title="Top Losers"
            icon={<TrendingDownIcon color="#F03722" />}
            movers={dashboard.top_movers.losers}
            currency={dashboard.net_worth.currency}
            emptyMsg="No losers in this period"
          />
        </div>

        {/* Liabilities */}
        <LiabilitiesCard debts={dashboard.debts} nw={dashboard.net_worth} />
      </div>
    </div>
  )
}
