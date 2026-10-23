// TODO: the real asset list (GET /portfolios/:id/assets) lacks change_pct_1m, needs_attention, detail and status;
// those are UI-only until the backend adds them. Other fields keep the API's names.

export type Investability = 'investable' | 'non_investable'

export interface AssetItem {
  id: string
  portfolio_id: string
  /** null: not filed, so it only shows under the default folder */
  folder_id: string | null
  asset_type: string
  name: string
  ticker: string | null
  logo_url: string | null
  investability: Investability
  /** Value of the part you own, in `converted_currency` */
  owned_value_converted: number
  converted_currency: string
  /** Units held, for ticker assets ("3,000 MSFT") */
  total_quantity: number | null
  /** Change over the last month, in %; null when there's no price history */
  change_pct_1m: number | null
  /** Flagged for a look (price alert, stale valuation) */
  needs_attention: boolean
  /** Second line under the name: the ticker, or e.g. a venture round ("Seed") */
  detail: string | null
  /** Second line under the type, e.g. "Active" */
  status: string | null
  created_at: string
  updated_at: string
}

/** The folder fields the asset menus need. Any folder object (e.g. from the folders feature) fits. */
export interface FolderRef {
  id: string
  name: string
}

/** The Assets page heading: everything the portfolio owns, and its 1M change. */
export interface AssetsOverview {
  currency: string
  total: number
  change: { amount: number; pct: number } | null
}
