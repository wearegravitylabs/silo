import { useState } from 'react'
import { CurrencyFlag } from '@/components/currency-flag'
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LineChart } from '@/components/line-chart'
import { PeriodTabs } from '@/components/period-tabs'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DashboardChartPoint, DashboardCurrencyAssets, DashboardNetWorth, DashboardPeriod } from '../../types'
import { NetWorthIcon } from '../shared/icons'
import { NetWorthTotal } from '../shared/net-worth-summary'

/**
 * Expanded Total Net Worth: total and change, a taller chart, then every currency with its assets.
 * Currency rows expand to list their assets; the first currency with assets starts open.
 */
export function NetWorthModal({
  open,
  onOpenChange,
  nw,
  chartPoints,
  period,
  onPeriod,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nw: DashboardNetWorth
  chartPoints: DashboardChartPoint[]
  period: DashboardPeriod
  onPeriod: (p: DashboardPeriod) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="wide" position="high" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <NetWorthIcon />
            Total Net Worth
          </DialogTitle>
        </DialogHeader>
        {/* The total, chart and periods keep their full size; only the currency list scrolls in the space left.
            On very short screens the list keeps 160px and the whole body scrolls instead. */}
        <DialogBody className="flex flex-col pb-0">
          <div className="shrink-0">
            <NetWorthTotal nw={nw} period={period} />
            <LineChart points={chartPoints} currency={nw.currency} label="Net worth" className="mt-4 h-50" />
            <PeriodTabs value={period} onChange={onPeriod} className="mt-3" />
          </div>
          <div className="mt-4 min-h-40 flex-1 overflow-y-auto border-t border-border pb-5">
            <CurrencyBreakdown currencies={nw.by_currency} />
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

function CurrencyBreakdown({ currencies }: { currencies: DashboardCurrencyAssets[] }) {
  const [open, setOpen] = useState(
    () =>
      new Set(
        currencies
          .filter((c) => c.count > 0)
          .slice(0, 1)
          .map((c) => c.currency),
      ),
  )
  const toggle = (currency: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (!next.delete(currency)) next.add(currency)
      return next
    })

  return (
    <ul className="divide-y divide-border">
      {currencies.map((c) => {
        const expandable = c.assets.length > 0
        const expanded = expandable && open.has(c.currency)
        return (
          <li key={c.currency} className={cn(expanded && 'bg-surface')}>
            <button
              type="button"
              disabled={!expandable}
              aria-expanded={expandable ? expanded : undefined}
              onClick={() => toggle(c.currency)}
              className="flex h-10.5 w-full items-center gap-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset enabled:hover:bg-surface"
            >
              <CurrencyFlag code={c.currency} />
              <span className="text-foreground">Assets in {c.currency}</span>
              <span className="ml-0.5 inline-flex h-5 min-w-4.5 items-center justify-center rounded-md border-[0.5px] border-line bg-accent px-1 text-xs text-foreground">
                {c.count}
              </span>
              <span className="ml-auto font-medium text-foreground">{formatMoney(c.value, c.currency)}</span>
            </button>
            {expanded && (
              <ul className="divide-y divide-border border-t border-border">
                {c.assets.map((asset) => (
                  <li key={asset.asset_id} className="flex h-10 items-center justify-between gap-4 pl-5.5">
                    <span className="truncate text-muted-foreground">{asset.name}</span>
                    <span className="shrink-0 text-foreground">{formatMoney(asset.value, c.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ul>
  )
}
