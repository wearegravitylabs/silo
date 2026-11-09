import { api, ApiError } from '@/lib/api-client'
import { isDemoPortfolio } from '@/lib/demo'
import { defaultFolderId, fromApiFolderId } from '@/lib/folders'
import { mockDelay } from '@/lib/mock'
import { CURRENCY, MOCK_ADDRESSES, MOCK_ASSETS, MOCK_CRYPTO, POPULAR, USD_RATES } from './mock-data'
import type {
  AddressSuggestion,
  AssetItem,
  AssetsOverview,
  ConnectInput,
  CreateAssetInput,
  CreateValuedAssetInput,
  TickerKind,
  TickerResult,
} from './types'

// Real portfolios use the API. Still mocked, in memory: the demo portfolio (see lib/demo), listed crypto (TODO: the API
// needs a price on every coin purchase but has no coin prices to offer), connected accounts and address search. A
// real portfolio's list mixes in the mocked assets made this session, so they show until reload.
const later = mockDelay(500)

const store = new Map<string, AssetItem[]>()
/** The mock store (shared with panel-api): the demo portfolio's assets, or a real one's mocked additions. */
export const assetsOf = (portfolioId: string) => {
  if (!store.has(portfolioId)) store.set(portfolioId, portfolioId === 'demo' ? MOCK_ASSETS.map((a) => ({ ...a })) : [])
  return store.get(portfolioId)!
}

/** True when the asset lives in the mock store: the demo portfolio's. A real portfolio's are all the API's. */
export const isMockedAsset = (portfolioId: string, _assetId?: string) => isDemoPortfolio(portfolioId)

// ─── API shapes ───────────────────────────────────────────────────────────────

/** The fields of the API's asset the UI uses. */
export interface ApiAsset {
  id: string
  portfolio_id: string
  folder_id: string | null
  name: string
  asset_type: string
  ticker: string
  quantity: number
  investability: 'cash' | 'investable' | 'non_investable'
  logo_url: string
  ownership_pct: number
  metadata?: { detail?: string; status?: string; color?: string; pictures?: string[] } | null
  owned_value_converted: number
  converted_currency: string
  created_at: string
  updated_at: string
}

// The API calls venture capital "vc".
const toApiType = (type: string) => (type === 'venture_capital' ? 'vc' : type)
const fromApiType = (type: string) => (type === 'vc' ? 'venture_capital' : type)
const HELD_IN_UNITS = ['stock_ticker', 'stock_manual', 'crypto_ticker', 'crypto_manual']

export const toAssetItem = (a: ApiAsset): AssetItem => ({
  id: a.id,
  portfolio_id: a.portfolio_id,
  folder_id: fromApiFolderId(a.folder_id),
  asset_type: fromApiType(a.asset_type),
  name: a.name,
  ticker: a.ticker || null,
  logo_url: a.logo_url || null,
  investability: a.investability === 'non_investable' ? 'non_investable' : 'investable',
  owned_value_converted: a.owned_value_converted,
  converted_currency: a.converted_currency,
  total_quantity: HELD_IN_UNITS.includes(a.asset_type) ? a.quantity : null,
  change_pct_1m: null,
  needs_attention: false,
  detail: a.metadata?.detail ?? (a.ticker || null),
  status: a.metadata?.status ?? null,
  color: a.metadata?.color ?? null,
  pictures: a.metadata?.pictures ?? [],
  ownership_pct: a.ownership_pct,
  created_at: a.created_at,
  updated_at: a.updated_at,
})

/** A picked image is a local blob: URL until uploaded; returns the URL to store. */
async function uploaded(url: string | null | undefined) {
  if (!url?.startsWith('blob:')) return url ?? undefined
  const form = new FormData()
  form.append('file', await (await fetch(url)).blob())
  return (await api<{ url: string }>('/upload', { method: 'POST', body: form })).url
}

const today = () => new Date().toISOString().slice(0, 10)

/** A real asset is always created in a folder (the page asks for one first). */
const folderFor = (folderId: string | null) => {
  if (!folderId || folderId === defaultFolderId('asset')) throw new Error('Create a folder for this asset first')
  return folderId
}

// ─── Assets page ──────────────────────────────────────────────────────────────

/** Total owned, and its change over the last 30 days. */
export const getAssetsOverview = async (portfolioId: string): Promise<AssetsOverview> => {
  if (!isDemoPortfolio(portfolioId)) {
    const o = await api<{ currency: string; total_assets: { value: number }; growth_30d: { amount: number; percentage: number } }>(
      `/portfolios/${portfolioId}/assets/overview`,
    )
    return { currency: o.currency, total: o.total_assets.value, change: { amount: o.growth_30d.amount, pct: o.growth_30d.percentage } }
  }
  const mocked = assetsOf(portfolioId)
  // Mock: the 1M change worked back from each asset's own change.
  const total = mocked.reduce((sum, a) => sum + a.owned_value_converted, 0)
  const amount = mocked.reduce((sum, a) => {
    const pct = a.change_pct_1m ?? 0
    return sum + a.owned_value_converted - a.owned_value_converted / (1 + pct / 100)
  }, 0)
  const before = total - amount
  return later({ currency: CURRENCY, total, change: { amount, pct: before > 0 ? (amount / before) * 100 : 0 } })
}

/** A folder's assets; no folder (or the demo's "All Assets") lists every asset in the portfolio. */
export const listAssets = async (portfolioId: string, folderId?: string): Promise<AssetItem[]> => {
  const all = !folderId || folderId === defaultFolderId('asset')
  if (isDemoPortfolio(portfolioId))
    return later(
      assetsOf(portfolioId)
        .filter((a) => all || a.folder_id === folderId)
        .map((a) => ({ ...a })),
    )
  const list = await api<ApiAsset[] | null>(`/portfolios/${portfolioId}/assets`, { params: { folder_id: all ? undefined : folderId } })
  return (list ?? []).map(toAssetItem)
}

/** File an asset in another folder (the demo's default folder unfiles it). */
export const moveAsset = async (portfolioId: string, assetId: string, folderId: string) => {
  if (!isMockedAsset(portfolioId, assetId)) {
    const body = { folder_id: folderFor(folderId) }
    return toAssetItem(await api<ApiAsset>(`/portfolios/${portfolioId}/assets/${assetId}`, { method: 'PATCH', body }))
  }
  const target = assetsOf(portfolioId).find((a) => a.id === assetId)
  if (!target) return Promise.reject(new Error('This asset no longer exists'))
  Object.assign(target, { folder_id: folderId === defaultFolderId('asset') ? null : folderId, updated_at: new Date().toISOString() })
  return later({ ...target })
}

/**
 * Files a deleted folder's mocked assets in `to` (the default folder unfiles them). The API's are moved before the
 * folder is deleted (see the folders feature).
 */
export const refileFolder = (portfolioId: string, from: string, to: string | null) => {
  const folderId = to === defaultFolderId('asset') ? null : to
  for (const asset of assetsOf(portfolioId)) if (asset.folder_id === from) asset.folder_id = folderId
  return later(null)
}

export const deleteAsset = async (portfolioId: string, assetId: string) => {
  if (!isMockedAsset(portfolioId, assetId)) {
    await api(`/portfolios/${portfolioId}/assets/${assetId}`, { method: 'DELETE' })
    return null
  }
  const list = assetsOf(portfolioId)
  const i = list.findIndex((a) => a.id === assetId)
  if (i !== -1) list.splice(i, 1)
  return later(null)
}

// ─── Ticker search ────────────────────────────────────────────────────────────

interface ApiStock {
  symbol: string
  name: string
  logo_url: string
  currency: string
  price: number
  prev_close: number
  change_pct: number
}

const MARKETS = ['US', 'NG'] as const

/** Listed stocks from both markets the API covers, merged; one market failing still shows the other. */
async function searchStocks(q: string): Promise<TickerResult[]> {
  const results = await Promise.allSettled(
    MARKETS.map((country) =>
      api<{ items: ApiStock[] | null }>('/stocks', { params: { country, search: q || undefined, limit: 10 } }).then((page) =>
        (page?.items ?? []).map((s): TickerResult => ({
          ticker: s.symbol,
          name: s.name,
          logo_url: s.logo_url || null,
          price: s.price,
          currency: s.currency,
          change: s.price - s.prev_close,
          change_pct: s.change_pct,
          country,
        })),
      ),
    ),
  )
  const found = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
  const failure = results.find((r) => r.status === 'rejected')
  if (!found.length && failure) throw failure.reason
  return found
}

/**
 * Stocks (from the API) or coins (mocked: no coin prices in the API yet) whose ticker contains `q`, or with a word in
 * the name starting with it; the popular ones while `q` is empty.
 */
export const searchTickers = (kind: TickerKind, q: string): Promise<TickerResult[]> => {
  const query = q.trim().toLowerCase()
  if (kind === 'stock') return searchStocks(query)
  if (!query) return later([...POPULAR.crypto])
  return later(
    MOCK_CRYPTO.filter(
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
 * A stock's or coin's price at a moment, for pricing each purchase. A stock from the API: today's price, as an
 * estimate (the API prices each purchase on its own date when the asset is created). Mocked coins: today is the quoted
 * price and earlier days drift around it, the same way every time.
 */
export function priceOn(stock: Pick<TickerResult, 'ticker' | 'price' | 'country'>, isoDateTime: string): number {
  const days = Math.max(0, Math.round((Date.now() - new Date(isoDateTime).getTime()) / 86_400_000))
  if (days === 0 || stock.country) return stock.price
  const seed = [...stock.ticker].reduce((sum, c) => sum + c.charCodeAt(0), 0)
  const drift = 1 + 0.35 * Math.sin((days + seed) / 23) - days * 0.0008
  return Number((stock.price * Math.max(0.2, drift)).toFixed(2))
}

// ─── Create ───────────────────────────────────────────────────────────────────

const createInApi = async (portfolioId: string, body: Record<string, unknown>) =>
  toAssetItem(await api<ApiAsset>(`/portfolios/${portfolioId}/assets`, { method: 'POST', body }))

/**
 * Adds a stock or coin. A listed stock's purchases are priced by the API on their dates; if it can't find a price,
 * today's (what the summary showed) is used. Manual ones are priced at the entered price.
 */
export const createAsset = async (portfolioId: string, input: CreateAssetInput): Promise<AssetItem> => {
  if (!isDemoPortfolio(portfolioId)) {
    if (input.asset_type === 'crypto_ticker') throw new Error('Crypto tickers can’t be added yet')
    const manual = input.asset_type.endsWith('_manual')
    const body = {
      folder_id: folderFor(input.folder_id),
      asset_type: input.asset_type,
      ticker: input.ticker,
      name: input.name,
      image_url: await uploaded(input.logo_url),
      currency: input.currency,
      country: input.country,
      current_price: manual ? input.price : undefined,
    }
    const lots = (price?: number) =>
      input.lots.map((l) => ({ quantity: l.quantity, acquisition_date: l.acquired_at.slice(0, 10), acquisition_price: price }))
    try {
      return await createInApi(portfolioId, { ...body, lots: lots(manual ? input.price : undefined) })
    } catch (err) {
      if (manual || !(err instanceof ApiError && err.code === 'ACQUISITION_PRICE_REQUIRED')) throw err
      return createInApi(portfolioId, { ...body, lots: lots(input.price) })
    }
  }
  // Mock: valued at what it cost — each purchase's quantity × its price, converted to the portfolio's currency.
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
    ownership_pct: 100,
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
 * Adds an asset you value yourself (real estate, a domain, a physical valuable, …) at its value. The API needs a
 * purchase: the one entered (physical valuables), else one unit bought today at the value.
 */
export const createValuedAsset = async (portfolioId: string, input: CreateValuedAssetInput): Promise<AssetItem> => {
  if (!isDemoPortfolio(portfolioId)) {
    const pictures = input.pictures?.length ? await Promise.all(input.pictures.map(uploaded)) : undefined
    const metadata = Object.fromEntries(
      Object.entries({ detail: input.detail, status: input.status, color: input.color, pictures }).filter(([, v]) => v != null && v !== ''),
    )
    const bought = input.acquisition
    return createInApi(portfolioId, {
      folder_id: folderFor(input.folder_id),
      asset_type: toApiType(input.asset_type),
      name: input.name,
      image_url: await uploaded(input.logo_url),
      subtype: input.subtype,
      currency: input.currency,
      // Preset for most types; the API needs it for manual assets and domains.
      investability: input.investable ? 'investable' : 'non_investable',
      location: input.asset_type === 'real_estate' ? input.name : undefined,
      current_price: input.value,
      metadata: Object.keys(metadata).length ? metadata : undefined,
      lots: [
        bought
          ? { quantity: 1, acquisition_date: bought.date.slice(0, 10), acquisition_price: bought.price }
          : { quantity: 1, acquisition_date: today(), acquisition_price: input.value },
      ],
    })
  }
  const now = new Date().toISOString()
  const asset: AssetItem = {
    id: crypto.randomUUID(),
    portfolio_id: portfolioId,
    folder_id: input.folder_id && input.folder_id !== defaultFolderId('asset') ? input.folder_id : null,
    asset_type: input.asset_type,
    name: input.name,
    ticker: null,
    logo_url: input.logo_url,
    investability: input.investable ? 'investable' : 'non_investable',
    owned_value_converted: input.value / (USD_RATES[input.currency] ?? 1),
    converted_currency: CURRENCY,
    total_quantity: null,
    change_pct_1m: null,
    needs_attention: false,
    detail: input.detail ?? null,
    status: input.status ?? null,
    color: input.color ?? null,
    pictures: input.pictures ?? [],
    ownership_pct: 100,
    created_at: now,
    updated_at: now,
  }
  assetsOf(portfolioId).push(asset)
  return later({ ...asset })
}

// What a mock connection brings in: one synced account per provider.
const CONNECTED: Record<string, Pick<AssetItem, 'name' | 'asset_type' | 'detail' | 'owned_value_converted'>> = {
  plaid: { name: 'Wells Fargo Checking', asset_type: 'bank', detail: '•••• 4821', owned_value_converted: 12_450 },
  coinbase: { name: 'Coinbase', asset_type: 'crypto_wallet', detail: 'Exchange', owned_value_converted: 3_250 },
  binance: { name: 'Binance', asset_type: 'crypto_wallet', detail: 'Exchange', owned_value_converted: 1_840.5 },
  kraken: { name: 'Kraken', asset_type: 'crypto_wallet', detail: 'Exchange', owned_value_converted: 960 },
  metamask: { name: 'Metamask', asset_type: 'crypto_wallet', detail: 'Wallet', owned_value_converted: 2_115.75 },
  phantom: { name: 'Phantom', asset_type: 'crypto_wallet', detail: 'Wallet', owned_value_converted: 430.2 },
}

/**
 * Connect a bank (Plaid) or a crypto exchange/wallet and add the synced account. TODO: Plaid Link / the exchange's
 * OAuth, then POST /portfolios/:id/connections; balances would sync from the provider.
 */
export const connectProvider = (portfolioId: string, input: ConnectInput): Promise<AssetItem> => {
  if (!isDemoPortfolio(portfolioId)) return Promise.reject(new Error('Connections can’t be added yet'))
  const synced = CONNECTED[input.provider]
  if (!synced) return Promise.reject(new Error('This provider isn’t supported yet'))
  const now = new Date().toISOString()
  const asset: AssetItem = {
    id: crypto.randomUUID(),
    portfolio_id: portfolioId,
    folder_id: input.folder_id && input.folder_id !== defaultFolderId('asset') ? input.folder_id : null,
    ticker: null,
    logo_url: null,
    investability: 'investable',
    converted_currency: CURRENCY,
    total_quantity: null,
    change_pct_1m: null,
    needs_attention: false,
    status: 'Connected',
    color: null,
    pictures: [],
    ownership_pct: 100,
    created_at: now,
    updated_at: now,
    ...synced,
  }
  assetsOf(portfolioId).push(asset)
  return new Promise((resolve) => setTimeout(() => resolve({ ...asset }), 1200))
}
