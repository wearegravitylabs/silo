import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PERIODS, type DashboardChartPoint, type DashboardNetWorth, type DashboardPeriod } from '../../types'
import { CardHead } from '../shared/card-head'
import { NetWorthIcon } from '../shared/icons'
import { LineChart } from '../shared/line-chart'

/** Series colour per currency; anything else is neutral grey. */
const CURRENCY_BAR: Record<string, string> = {
  NGN: 'bg-currency-ngn',
  USD: 'bg-currency-usd',
  EUR: 'bg-currency-eur',
  GBP: 'bg-currency-gbp',
}

export function NetWorthCard({
  nw,
  chartPoints,
  period,
  onPeriod,
  className,
}: {
  nw: DashboardNetWorth
  chartPoints: DashboardChartPoint[]
  period: DashboardPeriod
  onPeriod: (p: DashboardPeriod) => void
  className?: string
}) {
  const up = (nw.change_amount ?? 0) >= 0
  const description = PERIODS.find((p) => p.label === period)?.description

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHead icon={<NetWorthIcon />} title="Total Net Worth" bordered={false} />

      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5 px-4 pt-3">
        <div className="flex flex-col gap-2">
          <span className="font-heading text-[1.75rem] leading-9 font-bold tracking-[-0.0125rem] text-foreground">
            {formatMoney(nw.total, nw.currency)}
          </span>
          {nw.change_amount != null && (
            <p className="flex items-center gap-1.5 text-xs leading-5">
              <span className={cn('flex items-center gap-1 font-medium', up ? 'text-positive' : 'text-negative')}>
                {up ? <ArrowUpIcon className="size-3.5" aria-hidden /> : <ArrowDownIcon className="size-3.5" aria-hidden />}
                {formatMoney(Math.abs(nw.change_amount), nw.currency, { spaced: false })}
                {nw.change_pct != null && ` (${Math.abs(Math.round(nw.change_pct))}%)`}
              </span>
              {description}
            </p>
          )}
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-3">
          {nw.by_currency.map(({ currency, value }) => (
            <div key={currency} className="flex items-stretch gap-2.5">
              <span className={cn('w-0.75 shrink-0 rounded-full', CURRENCY_BAR[currency] ?? 'bg-currency-other')} />
              <div className="flex flex-col gap-1.5 py-0.5">
                <dt className="text-xs leading-4 text-muted-foreground">Assets in {currency}</dt>
                <dd className="font-medium text-foreground">{formatMoney(value, currency)}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      {/* The chart takes whatever height the card leaves: 200px when stacked, the rest of the 404px row when side by side. */}
      <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-4">
        <LineChart points={chartPoints} className="h-50 @4xl:h-auto @4xl:min-h-0 @4xl:flex-1" />
        <div className="mt-3 flex items-center justify-center gap-1" role="group" aria-label="Chart period">
          {PERIODS.map(({ label }) => (
            <button
              key={label}
              type="button"
              aria-pressed={label === period}
              onClick={() => onPeriod(label)}
              className="h-6 min-w-8 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-accent aria-pressed:font-semibold aria-pressed:text-foreground"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
