import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { getDashboard } from './api'
import type { DashboardPeriod } from './types'

export const dashboardQuery = (portfolioId: string, period: DashboardPeriod) =>
  queryOptions({
    queryKey: ['dashboard', portfolioId, period],
    queryFn: () => getDashboard(portfolioId, period),
    staleTime: 60_000,
  })

/** Keeps the previous period on screen while a new one loads (isPlaceholderData = switching). */
export const useDashboard = (portfolioId: string, period: DashboardPeriod) =>
  useQuery({ ...dashboardQuery(portfolioId, period), placeholderData: keepPreviousData })
