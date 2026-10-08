import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * White rounded content panel beside the sidebar.
 * `scrollable`: the panel is exactly the screen's height and scrolls inside itself (dashboard), so the
 * sticky topbar stays pinned — with min-height it would grow, the window would scroll, and the topbar
 * would scroll away. Otherwise content manages its own scrolling and overlays (the asset side panel)
 * position against it.
 */
export function MainPanel({ scrollable = false, children }: { scrollable?: boolean; children: ReactNode }) {
  return (
    <main
      className={cn(
        'flex min-w-0 flex-1 flex-col bg-background shadow-panel lg:rounded-l-2xl',
        scrollable ? 'h-dvh overflow-y-auto' : 'relative min-h-dvh overflow-hidden',
      )}
    >
      {children}
    </main>
  )
}
