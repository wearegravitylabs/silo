import { useState } from 'react'
import { PencilIcon } from 'lucide-react'
import { EntryCard } from '@/components/entry-card'
import { PlusCircleIcon } from '@/components/icons'
import { LineChart } from '@/components/line-chart'
import { TabBody, TabCta, TabListSkeleton } from '@/components/panel-layout'
import { PeriodTabs } from '@/components/period-tabs'
import { Button } from '@/components/ui/button'
import { currencySymbol, formatDay, formatMoney } from '@/lib/format'
import type { ChartPeriod } from '@/lib/periods'
import { cn } from '@/lib/utils'
import { useDebtChart, useDebtHistory } from '../../queries'
import type { Debt, DebtHistoryEntry } from '../../types'
import { BalanceDialog } from './balance-dialog'

const TITLES: Record<DebtHistoryEntry['kind'], string> = {
  initial: 'Initial Balance',
  adjustment: 'Balance Adjusted',
  repayment: 'Repayment',
}

/** History tab: balance stats, balance chart, every balance change; Add History and Update Balance. */
export function HistoryTab({ debt, portfolioId }: { debt: Debt; portfolioId: string }) {
  const [period, setPeriod] = useState<ChartPeriod>('1M')
  // Mode outlives `open` so the dialog keeps its title while it animates closed.
  const [dialog, setDialog] = useState<{ mode: 'repayment' | 'adjust'; open: boolean }>({ mode: 'repayment', open: false })
  const { data: entries, isPending } = useDebtHistory(portfolioId, debt.id)
  const { data: points = [] } = useDebtChart(portfolioId, debt.id, period)
  const initial = entries?.find((e) => e.kind === 'initial')?.balance ?? debt.principal

  return (
    <div className="flex flex-1 flex-col">
      <TabBody className="overflow-y-visible">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Stat label="Initial Balance">{formatMoney(initial, debt.currency)}</Stat>
          <Stat label="Current Value">{formatMoney(debt.owned_balance, debt.currency)}</Stat>
          {debt.interest_rate > 0 && (
            <Stat label="Interest Rate" className="text-destructive">
              {debt.interest_rate.toFixed(2)}%
            </Stat>
          )}
        </dl>

        <LineChart
          points={points}
          currency={debt.currency}
          tone="danger"
          fill="area"
          guides="x"
          startDot
          valueDecimals={2}
          label="Balance"
          className="mt-8 h-36 shrink-0"
        />
        <PeriodTabs value={period} onChange={setPeriod} className="mt-3" />

        <div className="mt-6 flex flex-col gap-2.5">
          {isPending ? (
            <TabListSkeleton rows={1} className="h-20" />
          ) : (
            entries?.map((entry) => <HistoryCard key={entry.id} entry={entry} currency={debt.currency} />)
          )}
        </div>
      </TabBody>

      <TabCta floating>
        <Button onClick={() => setDialog({ mode: 'repayment', open: true })}>
          <PlusCircleIcon className="text-white" />
          Add History
        </Button>
        <Button variant="secondary" onClick={() => setDialog({ mode: 'adjust', open: true })}>
          <PencilIcon className="size-3.5 text-muted-foreground" aria-hidden />
          Update Balance
        </Button>
      </TabCta>

      <BalanceDialog
        mode={dialog.mode}
        debt={debt}
        portfolioId={portfolioId}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
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

/** "$ 500" for whole amounts, "$ 10,500.25" otherwise. */
const money = (value: number, currency: string) => formatMoney(value, currency, { decimals: Number.isInteger(value) ? 0 : 2 })

/** One balance change: what happened and the new balance; how much it moved and the balance before. */
function HistoryCard({ entry, currency }: { entry: DebtHistoryEntry; currency: string }) {
  const delta = entry.previous === null ? null : entry.balance - entry.previous

  return (
    <EntryCard label={formatDay(entry.date)}>
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-foreground">{TITLES[entry.kind]}</span>
        <span className="text-foreground">{formatMoney(entry.balance, currency)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-xs leading-5">
        {/* A debt growing is bad news (red); paying it down is good (green). */}
        <span className={cn(delta === null || delta === 0 ? 'text-muted-foreground' : delta > 0 ? 'text-destructive' : 'text-success')}>
          {delta === null
            ? `${currencySymbol(currency)} -`
            : `${delta > 0 ? '+' : delta < 0 ? '-' : ''}${money(Math.abs(delta), currency)}`}
        </span>
        <span className="text-muted-foreground">Prev {entry.previous ? formatMoney(entry.previous, currency) : money(0, currency)}</span>
      </div>
    </EntryCard>
  )
}
