import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PERIODS, type DashboardChartPoint, type DashboardNetWorth, type DashboardPeriod } from '../types'
import { CardHead } from './card-head'
import { CoinIcon } from './icons'
import { LineChart } from './line-chart'

export function NetWorthCard({
  nw,
  chartPoints,
  period,
  onPeriod,
}: {
  nw: DashboardNetWorth
  chartPoints: DashboardChartPoint[]
  period: DashboardPeriod
  onPeriod: (p: DashboardPeriod) => void
}) {
  const up = (nw.change_pct ?? 0) >= 0
  const split = [
    { label: 'Assets', value: nw.assets, bar: 'bg-positive' },
    { label: 'Liabilities', value: nw.debts, bar: 'bg-negative' },
  ]

  return (
    <Card>
      <CardHead icon={<CoinIcon />} title="Net Worth" />

      <div className="flex items-end justify-between px-4 pt-4">
        <div className="flex flex-col gap-1">
          <span className="font-heading text-28 leading-9 font-bold tracking-[-0.3px]">{formatCurrency(nw.total, nw.currency)}</span>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Total net worth
            {nw.change_pct != null && (
              <>
                <span className="text-subtle">·</span>
                <span className={cn('font-medium', up ? 'text-positive' : 'text-negative')}>
                  {up ? '+' : ''}
                  {nw.change_pct.toFixed(2)}% this period
                </span>
              </>
            )}
          </p>
        </div>

        <dl className="flex gap-8">
          {split.map(({ label, value, bar }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={cn('h-10 w-1 shrink-0 rounded-2xl', bar)} />
              <div className="flex flex-col gap-1.5">
                <dt className="text-xs leading-5 text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium tracking-label">{formatCurrency(value, nw.currency)}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="p-4">
        <LineChart points={chartPoints} />
        <div className="mt-2 flex items-center justify-center gap-0.5" role="group" aria-label="Chart period">
          {PERIODS.map(({ label }) => (
            <button
              key={label}
              type="button"
              aria-pressed={label === period}
              onClick={() => onPeriod(label)}
              className="h-6 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-accent aria-pressed:font-semibold aria-pressed:text-foreground"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
