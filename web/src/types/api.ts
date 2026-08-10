export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number: string | null
  phone_country_code: string | null
  avatar_url: string | null
  is_email_verified: boolean
  is_onboarded: boolean
  portfolio_count: number
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface APIResponse<T = unknown> {
  code: number
  data: T | null
  message: string | null
  error: string | null
}

export interface Portfolio {
  id: string
  user_id: string
  name: string
  description: string
  base_currency: string
  image_url: string | null
  created_at: string
  updated_at: string
}

// ─── Folder ──────────────────────────────────────────────────────────────────

export interface Folder {
  id: string
  portfolio_id: string
  folder_type: 'asset' | 'debt'
  name: string
  icon: string | null
  image_url: string | null
  position: number
  created_at: string
  updated_at: string
}

// ─── Ticker search / preview ─────────────────────────────────────────────────

export interface TickerSearchResult {
  ticker: string
  company_name: string
  exchange: string
  asset_type: string
  logo_url: string
}

export interface TickerQuote {
  ticker: string
  company_name: string
  price: number
  currency: string
  change_24h: number
  pct_change: number
  exchange: string
  logo_url: string
  updated_at: string
}

// ─── Asset overview ──────────────────────────────────────────────────────────

export interface AssetOverviewBucket {
  value: number
  count: number
}

export interface AssetOverview {
  currency: string
  total_assets: AssetOverviewBucket
  growth_30d: { amount: number; percentage: number }
  investable: AssetOverviewBucket
  non_investable: AssetOverviewBucket
}

// ─── Asset ───────────────────────────────────────────────────────────────────

export interface AssetItem {
  id: string
  portfolio_id: string
  folder_id: string
  asset_type: string
  name: string
  ticker: string | null
  logo_url: string | null
  image_url: string | null
  icon: string | null
  ownership_pct: number
  investability: string
  investability_editable: boolean
  currency: string
  current_price: number | null
  total_value: number
  owned_value: number
  owned_value_converted: number
  converted_currency: string
  exchange_rate: number
  change_pct: number | null
  total_quantity: number | null
  created_at: string
  updated_at: string
}

// ─── Asset sub-resources ─────────────────────────────────────────────────────

export interface AssetLot {
  id: string
  asset_id: string
  quantity: number
  acquisition_price: number | null
  acquisition_date: string
  price_date_used: string | null
  notes: string
  created_at: string
}

export interface AssetNote {
  id: string
  asset_id: string | null
  portfolio_id: string
  title: string
  content: string
  tags?: { items?: string[] }
  created_at: string
  updated_at: string
}

export interface AssetDocument {
  id: string
  asset_id: string | null
  portfolio_id: string
  file_name: string
  file_type: string
  file_size: number
  uploaded_at: string
}

// ─── Autopilot ───────────────────────────────────────────────────────────────

export interface AutopilotRule {
  id: string
  portfolio_id: string
  target_id: string
  target_type: 'asset' | 'debt'
  action: 'add' | 'remove'
  amount: number
  percentage: number
  units: number | null
  frequency: string
  start_date: string
  end_date: string | null
  last_run_at: string | null
  next_run_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

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
