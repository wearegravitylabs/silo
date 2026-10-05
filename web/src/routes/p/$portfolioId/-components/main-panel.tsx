import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * White rounded content panel beside the sidebar.
 * `scrollable`: the whole panel scrolls (dashboard). Otherwise content manages its
 * own scrolling and overlays (the asset side panel) position against it.
 */
export function MainPanel({ scrollable = false, children }: { scrollable?: boolean; children: ReactNode }) {
  return (
    <main
      className={cn(
        'flex min-h-dvh flex-1 flex-col rounded-l-2xl bg-background shadow-panel',
        scrollable ? 'overflow-y-auto' : 'relative overflow-hidden',
      )}
    >
      {children}
    </main>
  )
}
