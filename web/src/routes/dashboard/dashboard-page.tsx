import { useEffect, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { DashboardOverview, WelcomeModal, useDashboard, type DashboardPeriod } from '@/features/dashboard'
import { useCurrentPortfolio } from '@/features/portfolios'
import { MainPanel } from '../app-layout/main-panel'
import { Topbar } from '../app-layout/topbar'

const route = getRouteApi('/_app/dashboard')
const WELCOME_KEY = 'silo:welcome-shown'
const DEFAULT_PERIOD: DashboardPeriod = '1M'

export function DashboardPage() {
  const { period = DEFAULT_PERIOD } = route.useSearch()
  const navigate = route.useNavigate()
  const goTo = useNavigate()
  const { portfolio } = useCurrentPortfolio()
  const portfolioId = portfolio?.id ?? ''
  // Same query DashboardOverview runs, deduped by React Query; needed for the header's sync time.
  const { data: dashboard } = useDashboard(portfolioId, period)

  const [showWelcome, setShowWelcome] = useState(false)
  useEffect(() => {
    if (localStorage.getItem(WELCOME_KEY)) return
    const t = setTimeout(() => setShowWelcome(true), 200)
    return () => clearTimeout(t)
  }, [])
  const closeWelcome = () => {
    setShowWelcome(false)
    localStorage.setItem(WELCOME_KEY, '1')
  }

  return (
    <MainPanel scrollable>
      <Topbar lastSyncedAt={dashboard?.last_synced_at} actionLabel="Invite" />
      <DashboardOverview
        portfolioId={portfolioId}
        portfolioName={portfolio?.name ?? 'Dashboard'}
        period={period}
        onPeriodChange={(p) => navigate({ search: p === DEFAULT_PERIOD ? {} : { period: p }, replace: true })}
        onAddAsset={() => goTo({ to: '/assets' })}
      />
      {showWelcome && <WelcomeModal onClose={closeWelcome} />}
    </MainPanel>
  )
}
