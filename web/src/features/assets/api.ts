import { defaultFolderId } from '@/lib/folders'
import { CURRENCY, MOCK_ADDRESSES, MOCK_ASSETS, MOCK_CRYPTO, MOCK_STOCKS, POPULAR, USD_RATES } from './mock-data'
import type {
  AddressSuggestion,
  AssetItem,
  AssetsOverview,
  CreateAssetInput,
  CreateValuedAssetInput,
  TickerKind,
  TickerResult,
} from './types'

// TODO: replace with the real endpoints once portfolios are real and the list has every field the page needs:
//   GET    /portfolios/:id/assets?folder_id=…   (exists; lacks change_pct_1m, needs_attention, detail, status)
//   GET    /portfolios/:id/assets/overview      (exists; total + growth_30d)
//   PATCH  /portfolios/:id/assets/:assetId      (exists; { folder_id })
//   DELETE /portfolios/:id/assets/:assetId      (exists)
//   GET    /portfolios/:id/assets/ticker/search?q=…  (exists)
//   POST   /portfolios/:id/assets              (exists; CreateAssetRequest with lots)
// Mock: the demo portfolio starts with the design's assets, every other portfolio empty; changes live in memory.
const DELAY = 500
const later = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY))

const store = new Map<string, AssetItem[]>()
const assetsOf = (portfolioId: string) => {
  if (!store.has(portfolioId)) store.set(portfolioId, portfolioId === 'demo' ? MOCK_ASSETS.map((a) => ({ ...a })) : [])
  return store.get(portfolioId)!
}

/** Total owned, and its 1M change worked back from each asset's own change. */
export const getAssetsOverview = (portfolioId: string): Promise<AssetsOverview> => {
  const assets = assetsOf(portfolioId)
  const total = assets.reduce((sum, a) => sum + a.owned_value_converted, 0)
  const amount = assets.reduce((sum, a) => {
    const pct = a.change_pct_1m ?? 0
    return sum + a.owned_value_converted - a.owned_value_converted / (1 + pct / 100)
  }, 0)
  const before = total - amount
  return later({ currency: CURRENCY, total, change: { amount, pct: before > 0 ? (amount / before) * 100 : 0 } })
}

/** The default folder ("All Assets") lists everything; any other folder only what's filed in it. */
export const listAssets = (portfolioId: string, folderId?: string): Promise<AssetItem[]> => {
  const all = assetsOf(portfolioId)
  return later(
    (!folderId || folderId === defaultFolderId('asset') ? all : all.filter((a) => a.folder_id === folderId)).map((a) => ({ ...a })),
  )
}

/** File an asset in a folder; the default folder unfiles it. */
export const moveAsset = (portfolioId: string, assetId: string, folderId: string) => {
  const target = assetsOf(portfolioId).find((a) => a.id === assetId)
  if (!target) return Promise.reject(new Error('This asset no longer exists'))
  Object.assign(target, { folder_id: folderId === defaultFolderId('asset') ? null : folderId, updated_at: new Date().toISOString() })
  return later({ ...target })
}

export const deleteAsset = (portfolioId: string, assetId: string) => {
  const list = assetsOf(portfolioId)
  const i = list.findIndex((a) => a.id === assetId)
  if (i !== -1) list.splice(i, 1)
  return later(null)
}

/**
 * Stocks or coins whose ticker contains `q`, or with a word in the name starting with it; the popular ones while `q`
 * is empty. TODO: stocks come from Yahoo (…/ticker/search?type=stock), coins from CoinGecko (…?type=crypto).
 */
export const searchTickers = (kind: TickerKind, q: string): Promise<TickerResult[]> => {
  const query = q.trim().toLowerCase()
  if (!query) return later([...POPULAR[kind]])
  const all = kind === 'stock' ? MOCK_STOCKS : MOCK_CRYPTO
  return later(
    all.filter(
      (t) =>
        t.ticker.toLowerCase().includes(query) ||
        t.name
          .toLowerCase()
          .split(/\s+/)
          .some((w) => w.startsWith(query)),
    ),
  )
}

/**
 * A stock's or coin's price at a moment, for pricing each purchase. Mock: today is the quoted price and earlier days drift
 * around it, the same way every time.
 * TODO: the backend prices lots by acquisition date when the asset is created (Yahoo history); use that here.
 */
export function priceOn(stock: Pick<TickerResult, 'ticker' | 'price'>, isoDateTime: string): number {
  const days = Math.max(0, Math.round((Date.now() - new Date(isoDateTime).getTime()) / 86_400_000))
  if (days === 0) return stock.price
  const seed = [...stock.ticker].reduce((sum, c) => sum + c.charCodeAt(0), 0)
  const drift = 1 + 0.35 * Math.sin((days + seed) / 23) - days * 0.0008
  return Number((stock.price * Math.max(0.2, drift)).toFixed(2))
}

/**
 * Adds a stock or coin valued at what it cost: each purchase's quantity × its price (a manual one's entered price, a
 * listed one's price on that date), converted to the portfolio's currency like the API does. Filed in `folder_id`
 * unless that's the default folder.
 */
export const createAsset = (portfolioId: string, input: CreateAssetInput): Promise<AssetItem> => {
  const now = new Date().toISOString()
  const quantity = input.lots.reduce((sum, l) => sum + l.quantity, 0)
  const unitPrice = (acquiredAt: string) => (input.asset_type.endsWith('_manual') ? input.price : priceOn(input, acquiredAt))
  const value = input.lots.reduce((sum, l) => sum + l.quantity * unitPrice(l.acquired_at), 0)
  const asset: AssetItem = {
    id: crypto.randomUUID(),
    portfolio_id: portfolioId,
    folder_id: input.folder_id && input.folder_id !== defaultFolderId('asset') ? input.folder_id : null,
    asset_type: input.asset_type,
    name: input.name,
    ticker: input.ticker,
    logo_url: input.logo_url,
    investability: 'investable',
    owned_value_converted: value / (USD_RATES[input.currency] ?? 1),
    converted_currency: CURRENCY,
    total_quantity: quantity,
    change_pct_1m: null,
    needs_attention: false,
    detail: input.ticker,
    status: null,
    color: null,
    pictures: [],
    created_at: now,
    updated_at: now,
  }
  assetsOf(portfolioId).push(asset)
  return later({ ...asset })
}

/** Addresses containing what's typed (from 3 characters). TODO: Google Places Autocomplete via the backend. */
export const searchAddresses = (q: string): Promise<AddressSuggestion[]> => {
  const query = q.trim().toLowerCase()
  if (query.length < 3) return Promise.resolve([])
  return new Promise((resolve) =>
    setTimeout(() => resolve(MOCK_ADDRESSES.filter((a) => a.description.toLowerCase().includes(query)).slice(0, 5)), 200),
  )
}

/**
 * Adds an asset you value yourself (real estate, a domain, a physical valuable) at its value, converted to the
 * portfolio's currency like the API does. TODO: POST /portfolios/:id/assets with the matching asset_type.
 */
export const createValuedAsset = (portfolioId: string, input: CreateValuedAssetInput): Promise<AssetItem> => {
  const now = new Date().toISOString()
  const asset: AssetItem = {
    id: crypto.randomUUID(),
    portfolio_id: portfolioId,
    folder_id: input.folder_id && input.folder_id !== defaultFolderId('asset') ? input.folder_id : null,
    asset_type: input.asset_type,
    name: input.name,
    ticker: null,
    logo_url: input.logo_url,
    investability: 'non_investable',
    owned_value_converted: input.value / (USD_RATES[input.currency] ?? 1),
    converted_currency: CURRENCY,
    total_quantity: null,
    change_pct_1m: null,
    needs_attention: false,
    detail: null,
    status: null,
    color: input.color ?? null,
    pictures: input.pictures ?? [],
    created_at: now,
    updated_at: now,
  }
  assetsOf(portfolioId).push(asset)
  return later({ ...asset })
}
