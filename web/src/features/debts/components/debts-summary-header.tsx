import { CirclePlusIcon, UploadIcon } from 'lucide-react'
import { ChangeText } from '@/components/change-text'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/format'
import { useDebtsOverview } from '../queries'

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
          {overview.change && <ChangeText change={overview.change} currency={overview.currency} inverse />}
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
