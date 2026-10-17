import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { getDashboard } from './api'
import type { DashboardMock, DashboardPeriod } from './types'

const dashboardQuery = (portfolioId: string, period: DashboardPeriod, mock?: DashboardMock) =>
  queryOptions({
    queryKey: ['dashboard', portfolioId, period, mock],
    queryFn: () => getDashboard(portfolioId, period, mock),
    staleTime: 60_000,
  })

/** Dashboard data for one portfolio and chart period. Keeps the previous period on screen while a new one loads. */
export const useDashboard = (portfolioId: string, period: DashboardPeriod, mock?: DashboardMock) =>
  useQuery({ ...dashboardQuery(portfolioId, period, mock), placeholderData: keepPreviousData })
