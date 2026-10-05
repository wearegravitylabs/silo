import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DashboardAllocItem, DashboardResponse } from '../types'
import { CardHead } from './card-head'
import { PieIcon } from './icons'

const SWATCHES = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']
const swatch = (i: number) => SWATCHES[i % SWATCHES.length]

export function AllocationCard({ allocation, currency }: { allocation: DashboardResponse['allocation']; currency: string }) {
  return (
    <Card>
      <CardHead icon={<PieIcon />} title="Asset Allocation" />
      <div className="flex gap-6 p-4">
        <AllocationSection items={allocation.assets} label="Assets" currency={currency} />
        <div className="w-px shrink-0 bg-border" />
        <AllocationSection items={allocation.debts} label="Liabilities" currency={currency} />
      </div>
    </Card>
  )
}

function AllocationSection({ items, label, currency }: { items: DashboardAllocItem[]; label: string; currency: string }) {
  const total = items.reduce((s, i) => s + i.value, 0)

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-xs leading-5 text-muted-foreground">{label}</h3>
        <span className="font-heading text-lg leading-6.5 font-bold">{total > 0 ? formatCurrency(total, currency) : '—'}</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-sm bg-accent">
        {items.map((item, i) => (
          <div key={item.label} className={cn('min-w-1 rounded-xs', swatch(i))} style={{ width: `${item.pct}%` }} />
        ))}
      </div>

      <ul className="flex flex-col divide-y">
        {items.length > 0
          ? items.map((item, i) => (
              <li key={item.label} className="flex h-10 items-center justify-between py-2">
                <span className="flex items-center gap-2 text-13">
                  <span className={cn('h-3 w-1 shrink-0 rounded-sm', swatch(i))} />
                  {item.label}
                  {item.count != null && <span className="text-11 text-subtle">{item.count}</span>}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{item.pct.toFixed(1)}%</span>
                  <span className="text-13 font-medium">{formatCurrency(item.value, currency)}</span>
                </span>
              </li>
            ))
          : // Ghost rows hint at what will appear here
            [20, 16, 18].map((w) => (
              <li key={w} className="flex h-10 items-center justify-between">
                <Skeleton className="h-3.25 animate-none" style={{ width: w * 4 }} />
                <Skeleton className="h-3.25 w-12 animate-none" />
              </li>
            ))}
      </ul>
    </section>
  )
}
