import { useState } from 'react'
import { PencilIcon } from 'lucide-react'
import { ChangeText } from '@/components/change-text'
import { EntryCard } from '@/components/entry-card'
import { PlusCircleIcon } from '@/components/icons'
import { LineChart } from '@/components/line-chart'
import { TabBody, TabCta, TabListSkeleton } from '@/components/panel-layout'
import { PeriodTabs } from '@/components/period-tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { currencySymbol, formatDay, formatMoney } from '@/lib/format'
import type { ChartPeriod } from '@/lib/periods'
import { cn } from '@/lib/utils'
import { useAssetChart, useAssetHistory, useAssetStats } from '../../panel-queries'
import type { AssetHistoryEntry, AssetItem } from '../../types'
import { AddHistoryDialog } from './add-history-dialog'
import { countsUnits } from './amount-fields'
import { UpdatePriceDialog } from './update-price-dialog'

/**
 * History tab: the value chart and every change. Ticker assets: what's invested and held, purchases marked on the
 * chart, and Add History. The rest: the acquisition price, price changes, and Update Price.
 */
export function HistoryTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const [period, setPeriod] = useState<ChartPeriod>('1M')
  const [editing, setEditing] = useState(false)
  const { data: entries, isPending } = useAssetHistory(portfolioId, asset.id)
  const { data: stats } = useAssetStats(portfolioId, asset.id)
  const { data: points = [] } = useAssetChart(portfolioId, asset.id, period)
  const currency = asset.converted_currency
  const units = countsUnits(asset)
  // A priced asset marks only where it started.
  const markers = entries
    ?.filter((e) => e.kind !== 'price' || e.previous === null)
    .map((e) => ({ date: e.date, kind: e.kind === 'remove' ? ('remove' as const) : ('add' as const) }))

  return (
    <div className="flex flex-1 flex-col">
      <TabBody className="overflow-y-visible">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Stat label={units ? 'Total Invested' : 'Acquisition Price'}>
            {stats ? formatMoney(stats.invested, currency) : <Skeleton className="h-4 w-20" />}
          </Stat>
          {units && (
            <Stat label="Total Quantity">
              {asset.total_quantity!.toLocaleString('en-US', { maximumFractionDigits: 8 })} {asset.ticker}
            </Stat>
          )}
          <Stat label="Current Value">{formatMoney(asset.owned_value_converted, currency)}</Stat>
          <Stat label="Gain/Loss">
            {stats ? (
              <ChangeText
                change={{ amount: stats.gain, pct: stats.gain_pct }}
                currency={currency}
                compact={false}
                className="text-sm leading-5.5"
              />
            ) : (
              <Skeleton className="h-4 w-24" />
            )}
          </Stat>
        </dl>

        <LineChart
          points={points}
          currency={currency}
          tone="brand"
          fill="area"
          guides="x"
          markers={markers}
          valueDecimals={2}
          label="Value"
          className="mt-8 h-36 shrink-0"
        />
        <PeriodTabs value={period} onChange={setPeriod} className="mt-3" />

        <div className="mt-6 flex flex-col gap-2.5">
          {isPending ? (
            <TabListSkeleton rows={1} className="h-20" />
          ) : (
            entries?.map((entry) =>
              entry.kind === 'price' ? (
                <PriceCard key={entry.id} entry={entry} currency={currency} />
              ) : (
                <HistoryCard key={entry.id} entry={entry} currency={currency} ticker={asset.ticker} />
              ),
            )
          )}
        </div>
      </TabBody>

      <TabCta floating>
        <Button onClick={() => setEditing(true)}>
          {units ? <PlusCircleIcon className="text-white" /> : <PencilIcon className="size-3.5" aria-hidden />}
          {units ? 'Add History' : 'Update Price'}
        </Button>
      </TabCta>

      {units ? (
        <AddHistoryDialog asset={asset} portfolioId={portfolioId} open={editing} onOpenChange={setEditing} />
      ) : (
        <UpdatePriceDialog asset={asset} portfolioId={portfolioId} open={editing} onOpenChange={setEditing} />
      )}
    </div>
  )
}

function Stat({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <dt className="text-xs leading-4 text-muted-foreground">{label}</dt>
      <dd className={cn('truncate text-foreground', className)}>{children}</dd>
    </div>
  )
}

/** "$300" for whole amounts, "$10,500.25" otherwise. */
const money = (value: number, currency: string) =>
  formatMoney(value, currency, { spaced: false, decimals: Number.isInteger(value) ? 0 : 2 })

/** One change: added or removed and its value; the units (or money) moved and the price per unit then. */
function HistoryCard({ entry, currency, ticker }: { entry: AssetHistoryEntry; currency: string; ticker: string | null }) {
  const add = entry.kind === 'add'
  const sign = add ? '+' : '-'
  return (
    <EntryCard label={formatDay(entry.date)}>
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-foreground">{add ? 'Added' : 'Removed'}</span>
        <span className="text-foreground">{money(entry.amount, currency)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-xs leading-5">
        <span className={add ? 'text-success' : 'text-destructive'}>
          {entry.quantity != null ? `${sign}${Number(entry.quantity.toFixed(8))} $${ticker}` : `${sign}${money(entry.amount, currency)}`}
        </span>
        {entry.price != null && ticker && (
          <span className="text-muted-foreground">
            {Number(entry.price.toFixed(2))} {currency} / {ticker}
          </span>
        )}
      </div>
    </EntryCard>
  )
}

/** A price change: the first is the estimate ("$ -", "Prev $ 0"); later ones show the move (green up, red down). */
function PriceCard({ entry, currency }: { entry: AssetHistoryEntry; currency: string }) {
  const delta = entry.previous === null ? null : entry.amount - entry.previous
  return (
    <EntryCard label={formatDay(entry.date)}>
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-foreground">{entry.previous === null ? 'Estimated Price' : 'Price Adjusted'}</span>
        <span className="text-foreground">{formatMoney(entry.amount, currency)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-xs leading-5">
        <span className={cn(!delta ? 'text-subtle' : delta > 0 ? 'text-success' : 'text-destructive')}>
          {delta === null
            ? `${currencySymbol(currency)} -`
            : `${delta > 0 ? '+' : delta < 0 ? '-' : ''}${formatMoney(Math.abs(delta), currency, { spaced: false })}`}
        </span>
        <span className="text-subtle">
          Prev {entry.previous ? formatMoney(entry.previous, currency) : formatMoney(0, currency, { decimals: 0 })}
        </span>
      </div>
    </EntryCard>
  )
}
