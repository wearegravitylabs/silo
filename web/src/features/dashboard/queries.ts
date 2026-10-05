import { useQuery } from '@tanstack/react-query'
import { getDashboard } from './api'
import type { DashboardPeriod } from './types'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  detail: (portfolioId: string, period: DashboardPeriod) => ['dashboard', portfolioId, period] as const,
}

export const useDashboard = (portfolioId: string, period: DashboardPeriod) =>
  useQuery({
    queryKey: dashboardKeys.detail(portfolioId, period),
    queryFn: () => getDashboard(portfolioId, period),
    enabled: !!portfolioId,
    staleTime: 60_000,
  })
