import { TrendLine } from '@/components/trend-line'
import { CardHead } from '@/components/card-head'
import { NetWorthIcon } from '@/components/icons'
import { formatMoney } from '@/lib/format'
import { projectionChange, TIMESTAMPS } from '../constants'
import type { ProjectionPoint } from '../types'

/** Six snapshots of the active scenario (1 month … 20 years): net worth, change from today, assets and debts. */
export function TimestampGrid({ points, currency }: { points: ProjectionPoint[]; currency: string }) {
  const start = points[0]

  return (
    <div className="grid gap-x-4 gap-y-5 @xl:grid-cols-2 @4xl:grid-cols-3">
      {TIMESTAMPS.map(({ months, label }) => {
        const p = points[months]
        const change = projectionChange(p.value, start.value, currency)
        return (
          <section key={months} className="flex min-w-0 flex-col gap-1.5" aria-label={label}>
            <h2 className="text-eyebrow">{label}</h2>
            <div className="rounded-2xl border border-border bg-card">
              <CardHead icon={<NetWorthIcon />} title="Net Worth" bordered={false} right={<span />} />
              <div className="flex flex-col gap-2 px-4 pt-1">
                <span className="truncate font-heading text-h6 leading-8 font-bold tracking-[-0.0125rem] text-foreground">
                  {formatMoney(p.value, currency)}
                </span>
                <TrendLine delta={change.delta} amount={change.amount} pct={change.pct} />
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4 px-4 pb-4">
                <Figure label="Assets" value={formatMoney(p.assets, currency)} />
                <Figure label="Debts" value={formatMoney(p.debts, currency)} />
              </dl>
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <dt className="text-xs leading-4 text-muted-foreground">{label}</dt>
      <dd className="truncate text-foreground">{value}</dd>
    </div>
  )
}
