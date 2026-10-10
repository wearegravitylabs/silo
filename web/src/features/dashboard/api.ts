import type { DashboardPeriod, DashboardResponse } from './types'
import { emptyDashboard, mockDashboard } from './mock-data'

// TODO: replace with the dashboard endpoint (GET /portfolios/:id/dashboard?period=…) once it exists.
// Mock: the demo portfolio has data; any portfolio made in onboarding starts empty.
export const getDashboard = (portfolioId: string, period: DashboardPeriod) =>
  new Promise<DashboardResponse>((resolve) =>
    setTimeout(() => resolve(portfolioId === 'demo' ? mockDashboard(period) : emptyDashboard(period)), 800),
  )
