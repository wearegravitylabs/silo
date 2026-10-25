import { useState } from 'react'
import { ChangeText } from '@/components/change-text'
import { EntryCard } from '@/components/entry-card'
import { PlusCircleIcon } from '@/components/icons'
import { LineChart } from '@/components/line-chart'
import { TabBody, TabCta, TabListSkeleton } from '@/components/panel-layout'
import { PeriodTabs } from '@/components/period-tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDay, formatMoney } from '@/lib/format'
import type { ChartPeriod } from '@/lib/periods'
import { cn } from '@/lib/utils'
import { useAssetChart, useAssetHistory, useAssetStats } from '../../panel-queries'
import type { AssetHistoryEntry, AssetItem } from '../../types'
import { AddHistoryDialog } from './add-history-dialog'

/** History tab: what's invested and held, the value chart (history marked on it), every change, and Add History. */
export function HistoryTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const [period, setPeriod] = useState<ChartPeriod>('1M')
  const [adding, setAdding] = useState(false)
  const { data: entries, isPending } = useAssetHistory(portfolioId, asset.id)
  const { data: stats } = useAssetStats(portfolioId, asset.id)
  const { data: points = [] } = useAssetChart(portfolioId, asset.id, period)
  const currency = asset.converted_currency

  return (
    <div className="flex flex-1 flex-col">
      <TabBody className="overflow-y-visible">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Stat label="Total Invested">{stats ? formatMoney(stats.invested, currency) : <Skeleton className="h-4 w-20" />}</Stat>
          {asset.total_quantity != null && (
            <Stat label="Total Quantity">
              {asset.total_quantity.toLocaleString('en-US', { maximumFractionDigits: 8 })} {asset.ticker}
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
          markers={entries?.map((e) => ({ date: e.date, kind: e.kind }))}
          valueDecimals={2}
          label="Value"
          className="mt-8 h-36 shrink-0"
        />
        <PeriodTabs value={period} onChange={setPeriod} className="mt-3" />

        <div className="mt-6 flex flex-col gap-2.5">
          {isPending ? (
            <TabListSkeleton rows={1} className="h-20" />
          ) : (
            entries?.map((entry) => <HistoryCard key={entry.id} entry={entry} currency={currency} ticker={asset.ticker} />)
          )}
        </div>
      </TabBody>

      <TabCta floating>
        <Button onClick={() => setAdding(true)}>
          <PlusCircleIcon className="text-white" />
          Add History
        </Button>
      </TabCta>

      <AddHistoryDialog asset={asset} portfolioId={portfolioId} open={adding} onOpenChange={setAdding} />
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
