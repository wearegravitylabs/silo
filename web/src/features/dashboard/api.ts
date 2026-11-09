import { api } from '@/lib/api-client'
import { isDemoPortfolio } from '@/lib/demo'
import type { DashboardDataStatus, DashboardMock, DashboardPeriod, DashboardResponse } from './types'
import { emptyDashboard, mockDashboard } from './mock-data'

// A real portfolio's dashboard is the API's (GET /portfolios/:id/dashboard), shown as it comes: the figures are
// worked out there, not here. A few plain fields it leaves out come from the asset, debt and asset-class lists.
// TODO: the API has no assets-by-currency breakdown, allocation by currency or folder, debt summary (scheduled and
// unscheduled totals, monthly payments, interest paid, debt-free date), mover windows or insights, so those stay empty.
// Mock: the demo portfolio has data; `mock` forces the busy or empty mock (the dev gallery).

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
  chart: { period: string; points: Array<{ date: string; value: number }> | null }
  allocation: { assets: Array<{ label: string; pct: number; count?: number }> | null }
  top_movers: { gainers: ApiMover[] | null; losers: ApiMover[] | null }
  debts: Array<{ debt_id: string; name: string; debt_type: string; owned_balance: number; currency: string }> | null
  last_synced_at: string
}

interface ApiMover {
  asset_id: string
  name: string
  ticker?: string
  logo_url?: string
  asset_type: string
  current_value: number
  change_amount: number | null
  change_pct: number | null
}

/** The periods the API charts (it has no 1D, YTD or All). */
const API_PERIODS: Partial<Record<DashboardPeriod, string>> = { '1M': '1M', '3M': '3M', '1Y': '1Y' }

const toMovers = (list: ApiMover[] | null, currencyOf: Map<string, string>, fallback: string) =>
  (list ?? []).map((m) => ({
    asset_id: m.asset_id,
    name: m.name,
    ticker: m.ticker || undefined,
    logo_url: m.logo_url || undefined,
    asset_type: m.asset_type,
    currency: currencyOf.get(m.asset_id) ?? fallback,
    current_value: m.current_value,
    change_amount: m.change_amount,
    change_pct: m.change_pct,
  }))

async function apiDashboard(portfolioId: string, period: DashboardPeriod): Promise<DashboardResponse> {
  const apiPeriod = API_PERIODS[period]
  const p = `/portfolios/${portfolioId}`
  // A period the API doesn't chart still loads the rest (the API falls back to 1M); its chart and change stay empty.
  const [d, assets, debts, classes] = await Promise.all([
    api<ApiDashboard>(`${p}/dashboard`, { params: { period: apiPeriod ?? '1M' } }),
    api<Array<{ id: string; currency: string }> | null>(`${p}/assets`),
    api<Array<{ id: string; interest_rate: number; payment_amount: number; frequency: string | null }> | null>(`${p}/debts`),
    api<Array<{ code: string; name: string }> | null>('/asset-classes'),
  ])
  const nw = d.net_worth
  const currencyOf = new Map((assets ?? []).map((a) => [a.id, a.currency]))
  const debtOf = new Map((debts ?? []).map((x) => [x.id, x]))
  const className = new Map((classes ?? []).map((c) => [c.code, c.name]))

  return {
    data_status: d.data_status,
    net_worth: {
      total: nw.total,
      assets: nw.assets,
      debts: nw.debts,
      currency: nw.currency,
      change_amount: apiPeriod ? nw.change_amount : null,
      change_pct: apiPeriod ? nw.change_pct : null,
      by_currency: [],
    },
    chart: { period, points: apiPeriod ? (d.chart.points ?? []) : [] },
    allocation: {
      by_type: (d.allocation.assets ?? []).map((a) => ({
        key: a.label,
        label: className.get(a.label) ?? a.label,
        pct: a.pct,
        count: a.count ?? 0,
      })),
      by_currency: [],
      by_folder: [],
    },
    top_movers: {
      gainers: toMovers(d.top_movers.gainers, currencyOf, nw.currency),
      losers: toMovers(d.top_movers.losers, currencyOf, nw.currency),
    },
    debts: {
      summary: {
        total: nw.debts,
        currency: nw.currency,
        scheduled_total: null,
        unscheduled_total: null,
        monthly_payments: null,
        interest_paid_ytd: null,
        debt_free_date: null,
      },
      items: (d.debts ?? []).map((x) => {
        const plan = debtOf.get(x.debt_id)
        return {
          debt_id: x.debt_id,
          name: x.name,
          debt_type: x.debt_type,
          // A repayment plan is a payment amount and how often it's paid.
          scheduled: !!plan?.frequency && plan.payment_amount > 0,
          balance: x.owned_balance,
          currency: x.currency,
          monthly_payment: plan?.frequency === 'monthly' ? plan.payment_amount : null,
          interest_rate: plan ? plan.interest_rate : null,
        }
      }),
    },
    insights: [],
    last_synced_at: d.last_synced_at,
  }
}

export const getDashboard = (portfolioId: string, period: DashboardPeriod, mock?: DashboardMock) => {
  if (!mock && !isDemoPortfolio(portfolioId)) return apiDashboard(portfolioId, period)
  return new Promise<DashboardResponse>((resolve) =>
    setTimeout(() => {
      const busy = mock ? mock === 'busy' : portfolioId === 'demo'
      resolve(busy ? mockDashboard(period) : emptyDashboard(period))
    }, 800),
  )
}
