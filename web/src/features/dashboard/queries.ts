import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { getDashboard } from './api'
import type { DashboardPeriod } from './types'

const dashboardQuery = (portfolioId: string, period: DashboardPeriod) =>
  queryOptions({
    queryKey: ['dashboard', portfolioId, period],
    queryFn: () => getDashboard(portfolioId, period),
    staleTime: 60_000,
  })

/** Dashboard data for one portfolio and chart period. Keeps the previous period on screen while a new one loads. */
export const useDashboard = (portfolioId: string, period: DashboardPeriod) =>
  useQuery({ ...dashboardQuery(portfolioId, period), placeholderData: keepPreviousData })
