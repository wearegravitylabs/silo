export type DashboardDataStatus = 'empty' | 'insufficient_history' | 'ready'

export interface DashboardNetWorth {
  total: number
  assets: number
  debts: number
  currency: string
  change_amount: number | null
  change_pct: number | null
}

export interface DashboardChartPoint {
  date: string
  value: number
}

export interface DashboardAllocItem {
  label: string
  value: number
  pct: number
  count?: number
}

export interface DashboardMover {
  asset_id: string
  name: string
  ticker?: string
  logo_url?: string
  asset_type: string
  current_value: number
  change_amount: number | null
  change_pct: number | null
}

export interface DashboardDebt {
  debt_id: string
  name: string
  debt_type: string
  balance: number
  owned_balance: number
  currency: string
  change_amount: number | null
  change_pct: number | null
}

export interface DashboardResponse {
  data_status: DashboardDataStatus
  net_worth: DashboardNetWorth
  chart: { period: string; points: DashboardChartPoint[] }
  allocation: { assets: DashboardAllocItem[]; debts: DashboardAllocItem[] }
  top_movers: { gainers: DashboardMover[]; losers: DashboardMover[] }
  debts: DashboardDebt[]
  last_synced_at: string
}

/** Chart periods: UI label → API value. */
export const PERIODS = [
  { label: '1W', api: 'W' },
  { label: '1M', api: '1M' },
  { label: '3M', api: '3M' },
  { label: '6M', api: '6M' },
  { label: '1Y', api: '1Y' },
] as const

export type DashboardPeriod = (typeof PERIODS)[number]['label']

export function isDashboardPeriod(value: unknown): value is DashboardPeriod {
  return PERIODS.some((p) => p.label === value)
}
