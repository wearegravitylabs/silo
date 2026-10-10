import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { CurrencyFlag } from '@/components/currency-flag'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DashboardAllocItem, DashboardResponse } from '../../types'
import { CardHead } from '../shared/card-head'
import { PieIcon } from '../shared/icons'

const ROWS = 4 // each column always shows 4 rows; missing ones are grey placeholders

const TYPE_COLOR: Record<string, string> = {
  stock: 'bg-type-stock',
  crypto: 'bg-type-crypto',
  real_estate: 'bg-type-real-estate',
}
const CURRENCY_COLOR: Record<string, string> = {
  NGN: 'bg-currency-ngn',
  USD: 'bg-currency-usd',
  EUR: 'bg-currency-eur',
  GBP: 'bg-currency-gbp',
}
const FOLDER_COLORS = ['bg-chart-1', 'bg-highlight', 'bg-chart-2', 'bg-warning']

/** Asset split three ways — type, currency, folder — each as a count, a stacked bar and a 4-row list. */
export function AllocationCard({ portfolioId, allocation }: { portfolioId: string; allocation: DashboardResponse['allocation'] }) {
  const hasAssets = allocation.by_type.some((item) => item.count > 0)

  return (
    <Card>
      <CardHead
        icon={<PieIcon />}
        title="Asset Allocation"
        bordered={false}
        right={
          hasAssets ? (
            <Button variant="secondary" size="xs" asChild className="shadow-elevated">
              <Link to="/portfolio/$portfolioId/assets" params={{ portfolioId }}>
                View all
              </Link>
            </Button>
          ) : (
            <span />
          )
        }
      />
      <div className="grid @3xl:grid-cols-3">
        <Breakdown title="By Type" items={allocation.by_type} color={(item) => TYPE_COLOR[item.key] ?? 'bg-type-other'} />
        <Breakdown
          title="By Currency"
          items={allocation.by_currency}
          color={(item) => CURRENCY_COLOR[item.key] ?? 'bg-currency-other'}
          marker={(item) => <CurrencyFlag code={item.key} />}
        />
        <Breakdown title="By Folder" items={allocation.by_folder} color={(_, i) => FOLDER_COLORS[i % FOLDER_COLORS.length]} />
      </div>
    </Card>
  )
}

function Breakdown({
  title,
  items,
  color,
  marker,
}: {
  title: string
  items: DashboardAllocItem[]
  color: (item: DashboardAllocItem, index: number) => string
  /** Replaces the colour swatch in the list (e.g. a flag). */
  marker?: (item: DashboardAllocItem) => ReactNode
}) {
  const placeholders = Math.max(ROWS - items.length, 0)
  const empty = items.every((item) => item.pct === 0)

  return (
    // Columns are divided by a left border on desktop and a top border when stacked.
    <section className="flex min-w-0 flex-col gap-2 border-border px-4 pt-3 not-first:border-t not-first:pt-4 @3xl:not-first:border-t-0 @3xl:not-first:border-l @3xl:not-first:pt-3">
      <h3 className="font-sans text-xs leading-5 font-normal text-muted-foreground">{title}</h3>
      <span className="font-medium text-foreground">{items.length}</span>

      {/* Stacked bar: zero-share items keep a 2px sliver so every listed item is visible.
          With nothing allocated yet, four equal grey segments stand in. */}
      <div className="mt-3 flex h-4 gap-0.5" aria-hidden>
        {empty
          ? Array.from({ length: ROWS }, (_, i) => <div key={i} className="flex-1 rounded-xs bg-accent" />)
          : items.map((item, i) => (
              <div key={item.key} className={cn('min-w-0.5 rounded-xs', color(item, i))} style={{ flexGrow: item.pct, flexBasis: 0 }} />
            ))}
      </div>

      <ul className="mt-3 flex flex-col divide-y divide-border border-t border-border">
        {items.slice(0, ROWS).map((item, i) => (
          <li key={item.key} className="flex h-11.5 items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-foreground">
              {marker ? (
                marker(item)
              ) : (
                <span className={cn('h-3.5 w-0.75 shrink-0 rounded-full', item.count > 0 ? color(item, i) : 'bg-line')} />
              )}
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 text-foreground tabular-nums">
              {Math.round(item.pct)}% ({item.count})
            </span>
          </li>
        ))}
        {Array.from({ length: placeholders }, (_, i) => (
          <li key={`empty-${i}`} className="flex h-11.5 items-center justify-between gap-3" aria-hidden>
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-0.75 shrink-0 rounded-full bg-line" />
              <span className="h-5 w-30 rounded-md bg-accent" />
            </span>
            <span className="shrink-0 text-foreground tabular-nums">0% (0)</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
