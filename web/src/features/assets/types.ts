import type { Frequency } from '@/lib/schedule'

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
  /** Disc colour (domains), a colour token; null for the default */
  color: string | null
  /** Photos (real estate) */
  pictures: string[]
  /** Share of the asset you own, 0–100; `owned_value_converted` is already scaled by it */
  ownership_pct: number
  created_at: string
  updated_at: string
}

/** The folder fields the asset menus need. Any folder object (e.g. from the folders feature) fits. */
export interface FolderRef {
  id: string
  name: string
  /** Its colour token; null picks one by position */
  color?: string | null
}

/** The Assets page heading: everything the portfolio owns, and its 1M change. */
export interface AssetsOverview {
  currency: string
  total: number
  change: { amount: number; pct: number } | null
}

/** Listed assets you pick by ticker: stocks (Yahoo Finance) or crypto (CoinGecko). */
export type TickerKind = 'stock' | 'crypto'

/** A stock or coin found by ticker search, with its latest price. */
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

/** Mirrors the backend's CreateAssetRequest: a listed stock or coin (priced by the market) or a manual one (priced by you). */
export interface CreateAssetInput {
  /** The folder it's created in; null or the default folder leaves it unfiled */
  folder_id: string | null
  asset_type: 'stock_ticker' | 'stock_manual' | 'crypto_ticker' | 'crypto_manual'
  ticker: string
  name: string
  logo_url: string | null
  currency: string
  /** Manual: the price per unit you entered. Listed: today's price (each purchase is priced on its date). */
  price: number
  lots: AssetLotInput[]
}

/** An asset valued by you rather than by the market: real estate, a domain, a physical valuable. */
export interface CreateValuedAssetInput {
  folder_id: string | null
  asset_type: 'real_estate' | 'domain' | 'physical' | 'venture_capital' | 'business' | 'manual'
  /** The address, the domain ("https://www.johndoe.com/"), the item's name */
  name: string
  /** Estimated or current value of your share, in `currency` */
  value: number
  /** Second lines in the table: under the name ("Seed") and under the type ("Active", "Loan") */
  detail?: string | null
  status?: string | null
  /** Counts toward investable assets (venture capital, a business) */
  investable?: boolean
  currency: string
  logo_url: string | null
  color?: string | null
  pictures?: string[]
  /** Physical valuables: what kind ("vehicle") */
  subtype?: string
  /** Physical valuables: when and for how much it was bought */
  acquisition?: { date: string; price: number; currency: string }
}

/** An address suggestion (Google Places). */
export interface AddressSuggestion {
  id: string
  description: string
}

/** A bank (Plaid) or crypto exchange/wallet to connect; balances sync from there. */
export interface ConnectInput {
  folder_id: string | null
  provider: 'plaid' | string
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
// TODO: no backend endpoints for an asset's history, rules, notes or documents yet; the shapes follow the debt ones.

/**
 * One change to the asset: units added or removed (ticker assets), or a new price for the rest — the first is its
 * estimated price, later ones adjust it.
 */
export interface AssetHistoryEntry {
  id: string
  asset_id: string
  /** YYYY-MM-DD */
  date: string
  kind: 'add' | 'remove' | 'price'
  /** Units, for ticker assets */
  quantity: number | null
  /** Value added or removed, or the new price, in the asset's currency */
  amount: number
  /** Price per unit at the time, for ticker assets */
  price: number | null
  /** The price before (price changes after the first) */
  previous: number | null
  created_at: string
}

export interface UpdateAssetPriceInput {
  value: number
  /** YYYY-MM-DD */
  date: string
}

export interface AddAssetHistoryInput {
  kind: 'add' | 'remove'
  /** Ticker assets: units; others: an amount of money */
  value: number
  /** YYYY-MM-DD */
  date: string
}

/** An asset's totals for the History tab. */
export interface AssetStats {
  /** What went in, less what came out (ticker assets); the first price (the rest) */
  invested: number
  /** Current value less what's invested, and as a % of it */
  gain: number
  gain_pct: number
}

export interface AssetRule {
  id: string
  asset_id: string
  action: 'add' | 'remove'
  /** Units (ticker assets) or money per run */
  amount: number
  frequency: Frequency
  /** YYYY-MM-DD */
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
}

export type AssetRuleInput = Pick<AssetRule, 'action' | 'amount' | 'frequency' | 'start_date' | 'end_date'>

export interface AssetNote {
  id: string
  asset_id: string
  title: string
  content: string
  tags: string[]
  created_at: string
}

export interface AssetNoteInput {
  title: string
  content: string
  tags: string[]
}

export interface AssetDocument {
  id: string
  asset_id: string
  file_name: string
  file_size: number
  uploaded_at: string
}
