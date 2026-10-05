import { useState } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import { avatarIdFromImageUrl, useCurrentPortfolio } from '@/features/portfolios'
import { endSession } from '@/lib/session'
import { Sidebar, type ActiveSection } from './sidebar'

const SECTIONS: Record<string, ActiveSection> = {
  '/dashboard': 'dashboard',
  '/assets': 'assets',
}

/**
 * Signed-in shell: sidebar + page. The route's beforeLoad has already loaded the
 * portfolios, so the current portfolio is known on first render.
 */
export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const { portfolio } = useCurrentPortfolio()

  return (
    <div className="flex" style={{ minHeight: '100dvh', background: '#F9F9FB', fontFamily: 'var(--font-sans)' }}>
      <Sidebar
        portfolioName={portfolio?.name ?? 'My portfolio'}
        avatarId={avatarIdFromImageUrl(portfolio?.image_url)}
        activeSection={SECTIONS[pathname] ?? 'dashboard'}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onLogout={endSession}
      />
      {portfolio && <Outlet />}
    </div>
  )
}
