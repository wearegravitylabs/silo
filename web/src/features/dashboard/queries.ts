import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { getDashboard } from './api'
import type { DashboardMock, DashboardPeriod, MoverWindow } from './types'

const dashboardQuery = (portfolioId: string, period: DashboardPeriod, mock?: DashboardMock, movers: MoverWindow = 'Today') =>
  queryOptions({
    queryKey: ['dashboard', portfolioId, period, mock, movers],
    queryFn: () => getDashboard(portfolioId, period, mock, movers),
    staleTime: 60_000,
  })

/** Dashboard data for one portfolio and chart period. Keeps the previous period on screen while a new one loads. */
export const useDashboard = (portfolioId: string, period: DashboardPeriod, mock?: DashboardMock) =>
  useQuery({ ...dashboardQuery(portfolioId, period, mock), placeholderData: keepPreviousData })

/**
 * Top movers over a window other than Today (the dashboard's own): the dashboard fetched again for that window.
 * Fetched only while `enabled`; keeps the last window's movers on screen while the next loads.
 */
export const useDashboardMovers = (
  portfolioId: string,
  period: DashboardPeriod,
  mock: DashboardMock | undefined,
  movers: MoverWindow,
  enabled: boolean,
) => useQuery({ ...dashboardQuery(portfolioId, period, mock, movers), enabled, placeholderData: keepPreviousData })
