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

/** A stock found by ticker search, with its latest price. */
export interface TickerResult {
  ticker: string
  name: string
  logo_url: string | null
  price: number
  currency: string
  /** Change over the last day, in `currency` and % */
  change: number
  change_pct: number
}

/** One purchase of a stock: how many, and when. */
export interface AssetLotInput {
  quantity: number
  /** Local ISO datetime, "2026-02-01T09:36" */
  acquired_at: string
}

/** Mirrors the backend's CreateAssetRequest: a ticker stock (priced by the market) or a manual one (priced by you). */
export interface CreateAssetInput {
  /** The folder it's created in; null or the default folder leaves it unfiled */
  folder_id: string | null
  asset_type: 'stock_ticker' | 'stock_manual'
  ticker: string
  name: string
  logo_url: string | null
  currency: string
  /** Manual stocks: the price per unit you entered. Ticker stocks: today's price (each purchase is priced on its date). */
  price: number
  lots: AssetLotInput[]
}
