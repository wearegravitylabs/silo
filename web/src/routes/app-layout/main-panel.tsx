import type { ReactNode } from 'react'
import { PANEL_SHADOW } from '@/lib/shadows'

/**
 * White rounded content panel beside the sidebar.
 * `scrollable`: the whole panel scrolls (dashboard). Otherwise content manages
 * its own scrolling and overlays can be positioned against it (assets).
 */
export function MainPanel({ scrollable = false, children }: { scrollable?: boolean; children: ReactNode }) {
  return (
    <div
      className="flex-1 flex flex-col"
      style={{
        background: '#FFF',
        boxShadow: PANEL_SHADOW,
        borderRadius: '16px 0 0 16px',
        minHeight: '100dvh',
        ...(scrollable ? { overflowY: 'auto' } : { overflow: 'hidden', position: 'relative' }),
      }}
    >
      {children}
    </div>
  )
}
