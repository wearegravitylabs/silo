import type { ReactNode } from 'react'

/**
 * White rounded panel beside the sidebar, exactly the screen's height. The shell puts the topbar on
 * top and the page (plus the Silo AI panel) below; pages handle their own scrolling inside, so the
 * topbar stays pinned.
 */
export function MainPanel({ children }: { children: ReactNode }) {
  return <main className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden bg-background shadow-panel lg:rounded-l-2xl">{children}</main>
}
