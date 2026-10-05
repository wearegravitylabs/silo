import { api } from '@/lib/api-client'
import { PERIODS, type DashboardPeriod, type DashboardResponse } from './types'

export const getDashboard = (portfolioId: string, period: DashboardPeriod) =>
  api<DashboardResponse>(`/portfolios/${portfolioId}/dashboard`, {
    params: { period: PERIODS.find((p) => p.label === period)?.api ?? '1M' },
  })
