import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Green/red ↗↘ pill for a percentage change. children override the label (e.g. "$410 (1.9%)"). */
export function ChangeBadge({ pct, children, className }: { pct: number | null | undefined; children?: ReactNode; className?: string }) {
  if (pct == null) return <span className="text-xs text-subtle">—</span>
  const up = pct >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.75 text-xs font-medium',
        up ? 'bg-positive-subtle text-positive' : 'bg-negative-subtle text-negative',
        className,
      )}
    >
      <span aria-hidden>{up ? '↗' : '↘'}</span>
      <span className="sr-only">{up ? 'Up' : 'Down'}</span>
      {children ?? `${Math.abs(pct).toFixed(1)}%`}
    </span>
  )
}
