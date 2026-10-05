import type { DashboardPeriod, DashboardResponse } from './types'
import { mockDashboard } from './mock-data'

// TODO: switch back to the API once the dashboard endpoint is ready:
// api<DashboardResponse>(`/portfolios/${portfolioId}/dashboard`, {
//   params: { period: PERIODS.find((p) => p.label === period)?.api ?? '1M' },
// })
export const getDashboard = (_portfolioId: string, period: DashboardPeriod) =>
  new Promise<DashboardResponse>((resolve) => setTimeout(() => resolve(mockDashboard(period)), 800))
