import { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { Callout } from '@/components/callout'
import { SubmitError, SummaryList } from '@/components/summary-list'
import { Button } from '@/components/ui/button'
import { formatDayMonthTime, formatMoney } from '@/lib/format'
import { DataAttribution } from './data-attribution'
import type { Lots } from './use-lots'

const EMPTY = '--'

/** 3000 → "3,000", 0.0001 → "0.0001" (coins keep their fractions) */
const units = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 8 })

/** "2026-02-01T09:36" → "01 Feb 2026 09:36 AM" */
const withYear = (iso: string) => {
  const [day, month, ...time] = formatDayMonthTime(iso).split(' ')
  return `${day} ${month} ${iso.slice(0, 4)} ${time.join(' ')}`
}

/**
 * Right pane of a stock's or coin's details step: the live Asset Summary, the DCA note once several purchases are
 * averaged, Create Asset, and the data source's attribution for listed ones.
 */
export function AssetSummary({
  name,
  symbol,
  currency,
  lots,
  priceAt,
  canSubmit,
  creating,
  error,
  noun,
  attribution,
  onCreate,
}: {
  name: string
  /** "$MSFT", "₦STLG" — empty while unknown */
  symbol: string
  currency: string
  lots: Lots
  /** Unit price of a purchase made at that moment */
  priceAt: (acquiredAt: string) => number
  canSubmit: boolean
  creating?: boolean
  error?: string
  /** "stocks", "crypto" (the DCA note) */
  noun: string
  /** Market data source to credit; none for manual assets */
  attribution?: 'yahoo' | 'coingecko'
  onCreate: () => void
}) {
  const [datesOpen, setDatesOpen] = useState(false)
  const money = (n: number) => formatMoney(n, currency, { spaced: false })
  const { unitPrice, total, averaged } = lots.costBasis(priceAt)
  const quantity = lots.totalQuantity
  const dates = lots.acquiredAts
  const several = dates.length > 1

  return (
    <>
      <SummaryList
        title="Asset Summary"
        rows={[
          { label: 'Asset Name', value: name || EMPTY },
          {
            label: 'Total Quantity',
            value: symbol ? `${units(quantity)} ${symbol}` : quantity > 0 ? units(quantity) : EMPTY,
          },
          {
            label: 'Acquisition Date',
            value: several ? (
              <button
                type="button"
                aria-expanded={datesOpen}
                onClick={() => setDatesOpen((o) => !o)}
                className="flex max-w-full items-center gap-1 rounded-sm outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <span className="truncate">{dates.map((d) => formatDayMonthTime(d).split(' ').slice(0, 2).join(' ')).join(', ')}</span>
                {datesOpen ? (
                  <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                ) : (
                  <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
              </button>
            ) : (
              formatDayMonthTime(dates[0])
            ),
            detail: several && datesOpen && (
              <ul className="flex animate-rise flex-wrap justify-end gap-1.5">
                {dates.map((d, i) => (
                  <li key={i} className="rounded-full border border-border bg-background px-2 text-xs leading-5 text-foreground">
                    {withYear(d)}
                  </li>
                ))}
              </ul>
            ),
          },
          { label: 'Price per Quantity', value: `${averaged ? '~' : ''}${money(unitPrice)}` },
          { label: 'Total Value', value: money(total), valueClassName: 'font-semibold' },
        ]}
      />

      {averaged && (
        <Callout variant="notice" title="DCA price per quantity">
          Due to the quantity of {noun} acquired at different time, the price per quantity has been Dollar Cost Averaged
        </Callout>
      )}

      <div className="flex flex-col gap-3">
        <Button onClick={onCreate} disabled={!canSubmit} loading={creating} loadingText="Creating…" className="w-full">
          Create Asset
        </Button>
        {error && <SubmitError message={error} />}
        {attribution && <DataAttribution source={attribution} />}
      </div>
    </>
  )
}
