import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/** Scrollable tab body; the panel shell provides the flex column it sits in. */
export function TabBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col overflow-y-auto px-6 py-5">{children}</div>
}

/** Action strip pinned under a tab body. */
export function TabCta({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-19 shrink-0 items-center justify-center border-t border-border/80 bg-background/50 backdrop-blur-[2px]">
      {children}
    </div>
  )
}

/** Centred "nothing here yet" message. */
export function TabEmpty({ title, body, icon }: { title: string; body: string; icon?: ReactNode }) {
  return (
    <div className="flex min-h-70 flex-1 flex-col items-center justify-center gap-1.5 text-center">
      {icon && <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-accent">{icon}</div>}
      <span className="font-medium">{title}</span>
      <span className="max-w-55 text-xs leading-5 text-muted-foreground">{body}</span>
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
