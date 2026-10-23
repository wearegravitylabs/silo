import { defaultFolderId } from '@/lib/folders'
import { CURRENCY, MOCK_ASSETS, MOCK_TICKERS, POPULAR_TICKERS } from './mock-data'
import type { AssetItem, AssetsOverview, CreateAssetInput, TickerResult } from './types'

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

/** Stocks whose ticker contains `q`, or with a word in the name starting with it; the popular ones while `q` is empty. */
export const searchTickers = (q: string): Promise<TickerResult[]> => {
  const query = q.trim().toLowerCase()
  if (!query) return later([...POPULAR_TICKERS])
  return later(
    MOCK_TICKERS.filter(
      (t) =>
        t.ticker.toLowerCase().includes(query) ||
        t.name
          .toLowerCase()
          .split(/\s+/)
          .some((w) => w.startsWith(query)),
    ),
  )
}

/** Adds a ticker asset valued at quantity × price, filed in `folder_id` (unless that's the default folder). */
export const createAsset = (portfolioId: string, input: CreateAssetInput): Promise<AssetItem> => {
  const now = new Date().toISOString()
  const quantity = input.lots.reduce((sum, l) => sum + l.quantity, 0)
  const asset: AssetItem = {
    id: crypto.randomUUID(),
    portfolio_id: portfolioId,
    folder_id: input.folder_id && input.folder_id !== defaultFolderId('asset') ? input.folder_id : null,
    asset_type: input.asset_type,
    name: input.name,
    ticker: input.ticker,
    logo_url: input.logo_url,
    investability: 'investable',
    owned_value_converted: quantity * input.price,
    converted_currency: input.currency,
    total_quantity: quantity,
    change_pct_1m: null,
    needs_attention: false,
    detail: input.ticker,
    status: null,
    created_at: now,
    updated_at: now,
  }
  assetsOf(portfolioId).push(asset)
  return later({ ...asset })
}
