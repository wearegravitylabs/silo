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

// ─── Inputs ──────────────────────────────────────────────────────────────────

export interface CreateLotInput {
  quantity: number
  acquisition_date: string
  notes?: string
}

export interface CreateAssetInput {
  folder_id: string
  asset_type: string
  ticker?: string
  name?: string
  image_url?: string
  ownership_pct?: number
  current_price?: number
  currency?: string
  lots: CreateLotInput[]
}

export interface UpdateAssetInput {
  ownership_pct?: number
  investability?: string
  folder_id?: string
}

export interface NoteInput {
  title?: string
  content?: string
  tags?: string[]
}

export interface UploadedFile {
  url: string
  key: string
  size: number
  content_type: string
}

/** The folder fields the asset UI needs. Any folder object (e.g. from the folders feature) fits. */
export interface FolderRef {
  id: string
  name: string
}
