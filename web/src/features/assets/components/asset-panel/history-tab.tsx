import { useState } from 'react'
import { PencilIcon } from 'lucide-react'
import { ChangeText } from '@/components/change-text'
import { EntryCard } from '@/components/entry-card'
import { PlusCircleIcon } from '@/components/icons'
import { LineChart } from '@/components/line-chart'
import { Stat, StatList, TabBody, TabCta, TabListSkeleton } from '@/components/panel-layout'
import { PeriodTabs } from '@/components/period-tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { currencySymbol, formatDay, formatMoney } from '@/lib/format'
import type { ChartPeriod } from '@/lib/periods'
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
  const { data: chart } = useAssetChart(portfolioId, asset.id, period)
  const currency = asset.converted_currency
  const units = countsUnits(asset)
  // A priced asset marks only where it started.
  const markers = entries
    ?.filter((e) => e.kind !== 'price' || e.previous === null)
    .map((e) => ({ date: e.date, kind: e.kind === 'remove' ? ('remove' as const) : ('add' as const) }))

  return (
    <div className="flex flex-1 flex-col">
      <TabBody className="overflow-y-visible">
        <StatList>
          <Stat label={units ? 'Total Invested' : 'Acquisition Price'}>
            {stats ? formatMoney(stats.invested, currency) : stats === null ? '—' : <Skeleton className="h-4 w-20" />}
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
            ) : stats === null ? (
              '—'
            ) : (
              <Skeleton className="h-4 w-24" />
            )}
          </Stat>
        </StatList>

        <LineChart
          points={chart?.points ?? []}
          currency={chart?.currency ?? currency}
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
                <PriceCard key={entry.id} entry={entry} currency={entry.currency ?? currency} />
              ) : (
                <HistoryCard key={entry.id} entry={entry} currency={entry.currency ?? currency} ticker={asset.ticker} />
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

/** "$300" for whole amounts, "$10,500.25" otherwise; a dash when there's none. */
const money = (value: number | null, currency: string) =>
  value == null ? '—' : formatMoney(value, currency, { spaced: false, decimals: Number.isInteger(value) ? 0 : 2 })

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

/**
 * A price change: the new price and the one before ("Prev $ 0" for the first). TODO: the move between them (green up,
 * red down) once the API gives it; it isn't worked out here.
 */
function PriceCard({ entry, currency }: { entry: AssetHistoryEntry; currency: string }) {
  return (
    <EntryCard label={formatDay(entry.date)}>
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-foreground">{entry.previous === null ? 'Estimated Price' : 'Price Adjusted'}</span>
        <span className="text-foreground">{money(entry.amount, currency)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-xs leading-5">
        <span className="text-subtle">{`${currencySymbol(currency)} -`}</span>
        <span className="text-subtle">
          Prev {entry.previous ? formatMoney(entry.previous, currency) : formatMoney(0, currency, { decimals: 0 })}
        </span>
      </div>
    </EntryCard>
  )
}
