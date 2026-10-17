import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Building blocks for slide-in detail panels (asset, debt): properties, tab bar, tab body, pinned CTA, empty state.

/** Label/value rows under a panel title ("Debt Type  Mortgage"). */
export function PropertyList({ className, children }: { className?: string; children: ReactNode }) {
  return <dl className={cn('flex flex-col gap-3', className)}>{children}</dl>
}

export function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 leading-5.5">
      <dt className="w-28 shrink-0 text-muted-foreground sm:w-35">{label}</dt>
      <dd className="min-w-0 truncate text-foreground">{children}</dd>
    </div>
  )
}

export interface PanelTab<T extends string> {
  id: T
  label: string
  /** Shown as a small boxed count when above 0 */
  count?: number
}

/** Underlined tab bar; scrolls sideways on narrow screens. Render the active tab's content below it. */
export function PanelTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className,
}: {
  tabs: PanelTab<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('flex shrink-0 items-end gap-6 overflow-x-auto border-b border-border px-4 sm:px-6', className)}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            '-mb-px flex h-10 shrink-0 items-center gap-1.5 border-b-2 py-2 font-medium whitespace-nowrap transition-colors outline-none focus-visible:text-foreground',
            value === t.id ? 'border-primary-dark text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
          {!!t.count && (
            <span className="inline-flex h-5 min-w-4.5 items-center justify-center rounded-md border-[0.5px] border-line bg-accent px-1 text-xs text-foreground">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

/** Scrollable tab body; the panel shell provides the flex column it sits in. */
export function TabBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex flex-1 flex-col overflow-y-auto px-6 py-5', className)}>{children}</div>
}

/**
 * Action strip under a tab body. `floating` sticks it to the bottom of a scrolling panel with no rule, so the
 * list scrolls on underneath its blur.
 */
export function TabCta({ floating = false, children }: { floating?: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex h-19 shrink-0 flex-wrap items-center justify-center gap-4 bg-background/50 px-4 backdrop-blur-[2px]',
        floating ? 'sticky bottom-0 z-10 mt-auto' : 'border-t border-border/80',
      )}
    >
      {children}
    </div>
  )
}

/** Centred "nothing here yet" message. */
export function TabEmpty({
  title,
  body,
  icon,
  bodyClassName,
}: {
  title: string
  body: string
  icon?: ReactNode
  /** e.g. a wider max-w for longer copy */
  bodyClassName?: string
}) {
  return (
    <div className="flex min-h-70 flex-1 flex-col items-center justify-center gap-1.5 text-center">
      {icon && <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-accent">{icon}</div>}
      <span className="font-medium">{title}</span>
      <span className={cn('max-w-55 text-xs leading-5 text-muted-foreground', bodyClassName)}>{body}</span>
    </div>
  )
}

/** Placeholder rows while a tab's list loads. */
export function TabListSkeleton({ rows = 3, className = 'h-16' }: { rows?: number; className?: string }) {
  return (
    <div className="flex flex-col gap-2.5" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={cn('animate-pulse rounded-xl bg-surface', className)} />
      ))}
    </div>
  )
}
