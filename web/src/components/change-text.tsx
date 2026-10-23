import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { formatCompactMoney, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * "↑ $1k (12%)" beside a page total. Up is green and down red — `inverse` swaps them for debts, where a rise is
 * bad. No change is grey with no arrow ("$ 0.00 (0%)").
 */
export function ChangeText({
  change,
  currency,
  inverse = false,
  compact = true,
  className,
}: {
  change: { amount: number; pct: number }
  currency: string
  inverse?: boolean
  /** "$1k" (default) or the exact "$25.40" */
  compact?: boolean
  className?: string
}) {
  const dir = change.amount > 0 ? 'up' : change.amount < 0 ? 'down' : 'flat'
  const Icon = dir === 'up' ? ArrowUpIcon : dir === 'down' ? ArrowDownIcon : null
  const good = (dir === 'up') !== inverse
  const amount =
    dir === 'flat'
      ? formatMoney(0, currency)
      : compact
        ? formatCompactMoney(Math.abs(change.amount), currency)
        : formatMoney(Math.abs(change.amount), currency, { spaced: false })
  const pct = Number(Math.abs(change.pct).toFixed(1))

  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs leading-5',
        dir === 'flat' ? 'text-muted-foreground' : good ? 'text-success' : 'text-destructive',
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" aria-label={dir === 'up' ? 'Up' : 'Down'} />}
      {amount} ({pct}%)
    </span>
  )
}
