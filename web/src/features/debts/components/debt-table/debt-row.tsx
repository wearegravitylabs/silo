import { useState } from 'react'
import { FlagIcon } from 'lucide-react'
import { ChangeBadge } from '@/components/change-badge'
import { Checkbox } from '@/components/ui/checkbox'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { DEBT_ICONS, DEBT_TYPE_LABELS, debtIconId, FREQUENCY_LABELS } from '../../constants'
import type { Debt } from '../../types'
import { DebtRowMenu } from './debt-row-menu'

/** One 72px debt row: type disc, name (+ attention flag), schedule, 1M change, value with interest note, ⋯ menu. */
export function DebtRow({ debt, selected, onSelect }: { debt: Debt; selected: boolean; onSelect: (selected: boolean) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const Icon = DEBT_ICONS[debtIconId(debt)]
  const schedule = debt.has_schedule && debt.frequency ? FREQUENCY_LABELS[debt.frequency] : '--'

  return (
    <tr className={cn('h-18 transition-colors', (menuOpen || selected) && 'bg-surface')}>
      <td className="pl-3 md:pl-4">
        <Checkbox checked={selected} onCheckedChange={(v) => onSelect(v === true)} aria-label={`Select ${debt.name}`} />
      </td>
      <td>
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-destructive-light/60 bg-destructive-subtle text-destructive">
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
              <span className="truncate">{debt.name}</span>
              {debt.needs_attention && (
                <FlagIcon className="size-3 shrink-0 fill-destructive text-destructive" aria-label="Needs attention" />
              )}
            </span>
            <span className="text-xs leading-4 text-muted-foreground">{DEBT_TYPE_LABELS[debt.debt_type] ?? debt.debt_type}</span>
          </div>
        </div>
      </td>
      <td className="hidden text-foreground md:table-cell">{schedule}</td>
      <td className="hidden md:table-cell">
        <ChangeBadge pct={debt.change_pct_1m} inverse hideEmpty />
      </td>
      <td className="text-right">
        <div className="flex flex-col items-end gap-1">
          <span className="text-foreground">{formatMoney(debt.owned_balance, debt.currency)}</span>
          <InterestNote debt={debt} />
        </div>
      </td>
      <td className="pr-3 text-right md:pr-4">
        <DebtRowMenu name={debt.name} onOpenChange={setMenuOpen} />
      </td>
    </tr>
  )
}

/** "0.50% interest", "Interest Free" for a scheduled 0% debt, nothing for an informal 0% one (e.g. a loan from a friend). */
function InterestNote({ debt }: { debt: Debt }) {
  if (debt.interest_rate > 0) {
    return <span className="text-xs leading-4 text-muted-foreground">{debt.interest_rate.toFixed(2)}% interest</span>
  }
  if (debt.has_schedule) return <span className="text-xs leading-4 text-success">Interest Free</span>
  return null
}
