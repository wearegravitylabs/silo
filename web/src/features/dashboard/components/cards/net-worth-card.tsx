import { useState } from 'react'
import { CardHead } from '@/components/card-head'
import { Card } from '@/components/ui/card'
import { LineChart } from '@/components/line-chart'
import { PeriodTabs } from '@/components/period-tabs'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DashboardChartPoint, DashboardNetWorth, DashboardPeriod } from '../../types'
import { NetWorthIcon } from '@/components/icons'
import { NetWorthTotal } from '../shared/net-worth-summary'
import { NetWorthModal } from './net-worth-modal'

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
  const [expanded, setExpanded] = useState(false)
  // Currencies with assets; an empty portfolio still shows the first few at zero. The modal lists them all.
  const held = nw.by_currency.filter((c) => c.count > 0)
  const currencies = held.length ? held : nw.by_currency.slice(0, 3)

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHead icon={<NetWorthIcon />} title="Total Net Worth" bordered={false} onExpand={() => setExpanded(true)} />

      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5 px-4 pt-3">
        <NetWorthTotal nw={nw} period={period} />

        <dl className="flex flex-wrap gap-x-6 gap-y-3">
          {currencies.map(({ currency, value }) => (
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
        <LineChart points={chartPoints} currency={nw.currency} label="Net worth" className="h-50 @4xl:h-auto @4xl:min-h-0 @4xl:flex-1" />
        <PeriodTabs value={period} onChange={onPeriod} className="mt-3" />
      </div>

      <NetWorthModal open={expanded} onOpenChange={setExpanded} nw={nw} chartPoints={chartPoints} period={period} onPeriod={onPeriod} />
    </Card>
  )
}
