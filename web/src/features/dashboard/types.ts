export type DashboardDataStatus = 'empty' | 'ready'

export interface DashboardNetWorth {
  total: number
  assets: number
  debts: number
  currency: string
  change_amount: number | null
  change_pct: number | null
  /** Assets held in each currency, in that currency (not converted). Currencies with no assets have count 0. */
  by_currency: DashboardCurrencyAssets[]
}

export interface DashboardCurrencyAssets {
  currency: string
  value: number
  count: number
  /** The assets making up `value`, in that currency (the expanded net worth breakdown). */
  assets: { asset_id: string; name: string; value: number }[]
}

export interface DashboardChartPoint {
  /** YYYY-MM-DD, or a full ISO timestamp for intraday points (1D). */
  date: string
  value: number
}

/** One slice of an allocation breakdown. `key` is stable (asset type, ISO currency code, folder id). */
export interface DashboardAllocItem {
  key: string
  label: string
  pct: number
  count: number
}

export interface DashboardMover {
  asset_id: string
  name: string
  ticker?: string
  logo_url?: string
  asset_type: string
  /** The asset's own currency — movers are shown unconverted ("$1,000.00", "₦100,000.00"). */
  currency: string
  current_value: number
  change_amount: number | null
  change_pct: number | null
}

/** Time window for top movers. */
export const MOVER_WINDOWS = ['Today', 'This Week', 'This Month'] as const
export type MoverWindow = (typeof MOVER_WINDOWS)[number]

export interface DashboardDebt {
  debt_id: string
  name: string
  /** student_loan | mortgage | auto_loan | personal | … — picks the row icon. */
  debt_type: string
  /** Scheduled debts have a repayment plan (monthly payment, interest); unscheduled ones (e.g. a loan from a friend) don't. */
  scheduled: boolean
  balance: number
  currency: string
  monthly_payment: number | null
  /** Annual %, 0 = interest free, null = not applicable. */
  interest_rate: number | null
}

export interface DashboardDebtSummary {
  total: number
  scheduled_total: number
  unscheduled_total: number
  monthly_payments: number
  interest_paid_ytd: number
  currency: string
  /** When scheduled debts are paid off at the current plan; null when there are none. */
  debt_free_date: string | null
}

/**
 * One AI insight. Section text may mark highlights inline: **dark** (key figures) and ++green++ (gains).
 * Example: "Your portfolio hit **₦1,000,000.00**, up ++12%++."
 */
export interface DashboardInsight {
  id: string
  title: string
  sections: { lead: string; text: string }[]
}

export interface DashboardResponse {
  data_status: DashboardDataStatus
  net_worth: DashboardNetWorth
  chart: { period: string; points: DashboardChartPoint[] }
  allocation: { by_type: DashboardAllocItem[]; by_currency: DashboardAllocItem[]; by_folder: DashboardAllocItem[] }
  top_movers: { gainers: DashboardMover[]; losers: DashboardMover[] }
  debts: { summary: DashboardDebtSummary; items: DashboardDebt[] }
  insights: DashboardInsight[]
  last_synced_at: string
}

/** Chart periods are shared app-wide (src/lib/periods). */
/** Which mock the dashboard serves until the API exists: `busy` (full demo data) or `empty` (a new portfolio). */
export type DashboardMock = 'busy' | 'empty'

export { CHART_PERIODS as PERIODS } from '@/lib/periods'
export type { ChartPeriod as DashboardPeriod } from '@/lib/periods'
