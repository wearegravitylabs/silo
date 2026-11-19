import { api } from '@/lib/api-client'
import { isDemoPortfolio } from '@/lib/demo'
import type { DashboardDataStatus, DashboardMock, DashboardPeriod, DashboardResponse, MoverWindow } from './types'
import { emptyDashboard, mockDashboard } from './mock-data'

// A real portfolio's dashboard is the API's (GET /portfolios/:id/dashboard), shown as it comes: the figures are
// worked out there, not here. Asset class and currency names come from the API's lists of them.
// TODO: insights (the AI card) come from silo-cloud's API, so the card stays empty here.
// Mock: the demo portfolio has data; `mock` forces the busy or empty mock (the dev gallery).

interface ApiAllocItem {
  key: string
  label: string
  pct: number
  count?: number
}

interface ApiDashboard {
  data_status: DashboardDataStatus
  net_worth: {
    total: number
    assets: number
    debts: number
    currency: string
    change_amount: number | null
    change_pct: number | null
  }
  /** Assets held in each currency, in that currency */
  net_worth_by_currency: Array<{ currency: string; assets: number }> | null
  chart: { period: string; points: Array<{ date: string; value: number }> | null }
  allocation: {
    /** By asset class (stock, crypto, real_estate, …): the page's "By Type" */
    assets: ApiAllocItem[] | null
    by_currency: ApiAllocItem[] | null
    /** key is the folder id, label its name */
    by_folder: ApiAllocItem[] | null
  }
  top_movers: { gainers: ApiMover[] | null; losers: ApiMover[] | null }
  debts: Array<{
    debt_id: string
    name: string
    debt_type: string
    /** The owned balance and monthly payment, in the base currency */
    owned_balance_converted: number
    has_schedule: boolean
    monthly_payment: number
    interest_rate: number
  }> | null
  debt_summary: {
    currency: string
    total: number
    scheduled_total: number
    unscheduled_total: number
    monthly_payments: number
    interest_paid_ytd: number
    debt_free_date: string | null
  }
  last_synced_at: string
}

interface ApiMover {
  asset_id: string
  name: string
  ticker?: string
  logo_url?: string
  asset_type: string
  /** The asset's own currency, which current_value is in */
  currency: string
  current_value: number
  change_amount: number | null
  change_pct: number | null
}

/** The chart periods and mover windows as the API names them. */
const API_PERIOD: Record<DashboardPeriod, string> = { '1D': '1D', '1M': '1M', '3M': '3M', YTD: 'YTD', '1Y': '1Y', All: 'ALL' }
const API_MOVERS: Record<MoverWindow, string> = { Today: 'today', 'This Week': 'week', 'This Month': 'month' }

const toMovers = (list: ApiMover[] | null) =>
  (list ?? []).map((m) => ({
    asset_id: m.asset_id,
    name: m.name,
    ticker: m.ticker || undefined,
    logo_url: m.logo_url || undefined,
    asset_type: m.asset_type,
    currency: m.currency,
    current_value: m.current_value,
    change_amount: m.change_amount,
    change_pct: m.change_pct,
  }))

const toAlloc = (list: ApiAllocItem[] | null, label: (item: ApiAllocItem) => string = (i) => i.label) =>
  (list ?? []).map((i) => ({ key: i.key, label: label(i), pct: i.pct, count: i.count ?? 0 }))

async function apiDashboard(portfolioId: string, period: DashboardPeriod, movers: MoverWindow): Promise<DashboardResponse> {
  const [d, classes, currencies] = await Promise.all([
    api<ApiDashboard>(`/portfolios/${portfolioId}/dashboard`, { params: { period: API_PERIOD[period], movers: API_MOVERS[movers] } }),
    api<Array<{ code: string; name: string }> | null>('/asset-classes'),
    api<Array<{ code: string; name: string }> | null>('/currencies'),
  ])
  const nw = d.net_worth
  const debts = d.debt_summary
  const className = new Map((classes ?? []).map((c) => [c.code, c.name]))
  const currencyName = new Map((currencies ?? []).map((c) => [c.code, c.name]))
  const heldIn = new Map((d.allocation.by_currency ?? []).map((c) => [c.key, c.count ?? 0]))

  return {
    data_status: d.data_status,
    net_worth: {
      total: nw.total,
      assets: nw.assets,
      debts: nw.debts,
      currency: nw.currency,
      change_amount: nw.change_amount,
      change_pct: nw.change_pct,
      // The API doesn't list each currency's assets, so the expanded view shows the totals only.
      by_currency: (d.net_worth_by_currency ?? []).map((c) => ({
        currency: c.currency,
        value: c.assets,
        count: heldIn.get(c.currency) ?? 0,
        assets: [],
      })),
    },
    chart: { period, points: d.chart.points ?? [] },
    allocation: {
      by_type: toAlloc(d.allocation.assets, (i) => className.get(i.key) ?? i.label),
      by_currency: toAlloc(d.allocation.by_currency, (i) => (currencyName.has(i.key) ? `${currencyName.get(i.key)} (${i.key})` : i.label)),
      by_folder: toAlloc(d.allocation.by_folder),
    },
    top_movers: { gainers: toMovers(d.top_movers.gainers), losers: toMovers(d.top_movers.losers) },
    debts: {
      summary: {
        total: debts.total,
        currency: debts.currency,
        scheduled_total: debts.scheduled_total,
        unscheduled_total: debts.unscheduled_total,
        monthly_payments: debts.monthly_payments,
        interest_paid_ytd: debts.interest_paid_ytd,
        debt_free_date: debts.debt_free_date,
      },
      // In the base currency, like the summary above them.
      items: (d.debts ?? []).map((x) => ({
        debt_id: x.debt_id,
        name: x.name,
        debt_type: x.debt_type,
        scheduled: x.has_schedule,
        balance: x.owned_balance_converted,
        currency: debts.currency,
        monthly_payment: x.has_schedule ? x.monthly_payment : null,
        interest_rate: x.interest_rate,
      })),
    },
    insights: [],
    last_synced_at: d.last_synced_at,
  }
}

/** The dashboard for a chart period, its top movers over `movers` (the mocks have one set of movers). */
export const getDashboard = (portfolioId: string, period: DashboardPeriod, mock?: DashboardMock, movers: MoverWindow = 'Today') => {
  if (!mock && !isDemoPortfolio(portfolioId)) return apiDashboard(portfolioId, period, movers)
  return new Promise<DashboardResponse>((resolve) =>
    setTimeout(() => {
      const busy = mock ? mock === 'busy' : portfolioId === 'demo'
      resolve(busy ? mockDashboard(period) : emptyDashboard(period))
    }, 800),
  )
}
