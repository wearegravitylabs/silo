import type { DashboardMock, DashboardPeriod, DashboardResponse } from './types'
import { emptyDashboard, mockDashboard } from './mock-data'

// TODO: replace with the dashboard endpoint (GET /portfolios/:id/dashboard?period=…) once it exists.
// Mock: the demo portfolio has data; any portfolio made in onboarding starts empty. `mock` forces one or the other.
export const getDashboard = (portfolioId: string, period: DashboardPeriod, mock?: DashboardMock) =>
  new Promise<DashboardResponse>((resolve) =>
    setTimeout(() => {
      const busy = mock ? mock === 'busy' : portfolioId === 'demo'
      resolve(busy ? mockDashboard(period) : emptyDashboard(period))
    }, 800),
  )
