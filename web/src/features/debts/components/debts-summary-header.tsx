import { ArrowDownIcon, ArrowUpIcon, CirclePlusIcon, UploadIcon } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { formatCompactMoney, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDebtsOverview } from '../queries'
import type { DebtsOverview } from '../types'

/** "Debts" heading: portfolio debt total, its 1M change, Export and Add Debt actions. */
export function DebtsSummaryHeader({
  portfolioId,
  currency,
  onExport,
  onAddDebt,
}: {
  portfolioId: string
  currency: string
  onExport?: () => void
  onAddDebt?: () => void
}) {
  const overview = useDebtsOverview(portfolioId, currency)

  return (
    <PageHeader
      eyebrow="Debts"
      className="items-center px-4 pt-5 pb-5 md:px-10"
      title={
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h1 className="font-heading font-bold tracking-[-0.3px]">{formatMoney(overview.total, overview.currency)}</h1>
          {overview.change && <DebtChange change={overview.change} currency={overview.currency} />}
        </div>
      }
      actions={
        <>
          <Button variant="secondary" onClick={onExport} className="font-medium">
            <UploadIcon className="size-3.5 text-muted-foreground" aria-hidden />
            Export
          </Button>
          <Button onClick={onAddDebt} className="px-3.5">
            <CirclePlusIcon className="size-3.5" aria-hidden />
            Add Debt
          </Button>
        </>
      }
    />
  )
}

/**
 * "↑ $10k (100%)". For debts a rise is bad: up is red, down green, no change grey with no arrow ("$ 0.00 (0%)").
 */
function DebtChange({ change, currency }: { change: NonNullable<DebtsOverview['change']>; currency: string }) {
  const dir = change.amount > 0 ? 'up' : change.amount < 0 ? 'down' : 'flat'
  const Icon = dir === 'up' ? ArrowUpIcon : dir === 'down' ? ArrowDownIcon : null
  const amount = dir === 'flat' ? formatMoney(0, currency) : formatCompactMoney(Math.abs(change.amount), currency)
  const pct = Number(Math.abs(change.pct).toFixed(1))

  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs leading-5',
        dir === 'up' ? 'text-destructive' : dir === 'down' ? 'text-success' : 'text-muted-foreground',
      )}
    >
      {Icon && <Icon className="size-3.5" aria-label={dir === 'up' ? 'Up' : 'Down'} />}
      {amount} ({pct}%)
    </span>
  )
}
