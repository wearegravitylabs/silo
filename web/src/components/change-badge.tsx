import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Green/red ↗↘ pill for a percentage change. children override the label (e.g. "$410 (1.9%)").
 * `inverse` is for values where a rise is bad (debts): up turns red, down green.
 * A missing change shows "—", or nothing with `hideEmpty`.
 */
export function ChangeBadge({
  pct,
  inverse = false,
  hideEmpty = false,
  children,
  className,
}: {
  pct: number | null | undefined
  inverse?: boolean
  hideEmpty?: boolean
  children?: ReactNode
  className?: string
}) {
  if (pct == null) return hideEmpty ? null : <span className="text-xs text-subtle">—</span>
  const up = pct >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.75 text-xs font-medium',
        up !== inverse ? 'bg-success-subtle text-success' : 'bg-destructive-subtle text-destructive',
        className,
      )}
    >
      <span aria-hidden>{up ? '↗' : '↘'}</span>
      <span className="sr-only">{up ? 'Up' : 'Down'}</span>
      {children ?? `${Math.abs(pct).toFixed(1)}%`}
    </span>
  )
}
