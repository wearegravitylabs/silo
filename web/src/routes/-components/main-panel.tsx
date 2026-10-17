import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * White rounded panel beside the sidebar, exactly the screen's height. The shell puts the topbar on
 * top and the page (plus the Silo AI panel) below; pages handle their own scrolling inside, so the
 * topbar stays pinned. `className` can swap the height (h-full when something sits under the shell).
 */
export function MainPanel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <main className={cn('flex h-dvh min-w-0 flex-1 flex-col overflow-hidden bg-background shadow-panel lg:rounded-l-2xl', className)}>
      {children}
    </main>
  )
}
