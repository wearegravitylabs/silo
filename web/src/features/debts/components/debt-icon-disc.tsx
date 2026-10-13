import { cn } from '@/lib/utils'
import { DEBT_ICONS, debtIconId } from '../constants'
import type { Debt } from '../types'

/** A debt's red icon on a pink disc (table rows, detail panel). Size the disc with className (default 40px). */
export function DebtIconDisc({ debt, className }: { debt: Pick<Debt, 'debt_type' | 'icon'>; className?: string }) {
  const Icon = DEBT_ICONS[debtIconId(debt)]
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full border border-destructive-light/60 bg-destructive-subtle text-destructive',
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
    </span>
  )
}
