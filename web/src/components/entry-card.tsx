import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * List card with a grey header strip — a small-caps `label` ("FEB 12, 2026", "ADDED MAR 4, 2026") and optional
 * `actions` — over a white bordered body. History entries, Auto-Pilot rules, notes.
 */
export function EntryCard({
  label,
  actions,
  className,
  children,
}: {
  label: ReactNode
  actions?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <article className={cn('rounded-xl border border-border bg-surface', className)}>
      <header className="flex h-6.5 items-center justify-between gap-3 px-3">
        <span className="truncate text-eyebrow">{label}</span>
        {actions && <div className="flex shrink-0 items-center gap-2.5 text-subtle">{actions}</div>}
      </header>
      <div className="-mx-px -mb-px flex flex-col gap-1.5 rounded-xl border border-border bg-background px-3 py-2.5">{children}</div>
    </article>
  )
}

/** Icon button for an EntryCard header (edit, delete, pause). */
export function EntryAction({
  label,
  onClick,
  tone = 'default',
  children,
}: {
  label: string
  onClick?: () => void
  tone?: 'default' | 'danger'
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'flex size-4 items-center justify-center rounded-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        tone === 'danger' ? 'hover:text-destructive' : 'hover:text-muted-foreground',
      )}
    >
      {children}
    </button>
  )
}
