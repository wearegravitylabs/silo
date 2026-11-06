import { api, ApiError, uploadWithProgress } from '@/lib/api-client'
import {
  createRule,
  deleteRule,
  listRules,
  noteBody,
  noteTags,
  ruleDays,
  toggleRule,
  type ApiDocument,
  type ApiNote,
  type ApiRule,
} from '@/lib/item-api'
import { daysFromToday, isoDay } from '@/lib/dates'
import { mockDelay } from '@/lib/mock'
import { periodDays, type ChartPeriod } from '@/lib/periods'
import { assetsOf, isMockedAsset, toAssetItem, type ApiAsset } from './api'
import type {
  AddAssetHistoryInput,
  AssetDocument,
  AssetHistoryEntry,
  AssetItem,
  AssetNote,
  AssetNoteInput,
  AssetRule,
  AssetRuleInput,
  AssetStats,
  Investability,
  UpdateAssetPriceInput,
} from './types'

// Real assets use the API (see the API section at the end); the demo portfolio's and other mocked assets stay in memory,
// where history moves the asset's units and value so the table and header follow.
const later = mockDelay(400)
const CHART_POINTS = 40

const daysAgo = (n: number) => daysFromToday(-n)

const find = (portfolioId: string, assetId: string) => {
  const asset = assetsOf(portfolioId).find((a) => a.id === assetId)
  if (!asset) throw new Error('This asset no longer exists')
  return asset
}

/** Price per unit now: value over units (ticker assets). */
const unitPrice = (asset: AssetItem) => (asset.total_quantity ? asset.owned_value_converted / asset.total_quantity : 0)

// ─── History ──────────────────────────────────────────────────────────────────

// The design's MSFT purchases (days ago, units, price); 3,000 units in all.
const MSFT_LOTS: Array<[number, number, number]> = [
  [60, 1200, 3.6],
  [26, 500, 4],
  [22, 600, 4.1],
  [17, 400, 4.25],
  [12, -200, 4.45],
  [8, 300, 4.2],
  [3, 200, 4.3],
]

// The design's Solana purchase: 10 SOL at 84.5 at the start of the month (so it sits at the 1M chart's left edge).
const SOL_LOT: [number, number, number] = [30, 10, 84.5]

const history = new Map<string, AssetHistoryEntry[]>()

const entry = (
  asset: AssetItem,
  date: string,
  kind: AssetHistoryEntry['kind'],
  quantity: number | null,
  amount: number,
  price: number | null,
  previous: number | null = null,
) => ({
  id: crypto.randomUUID(),
  asset_id: asset.id,
  date,
  kind,
  quantity,
  amount,
  price,
  previous,
  created_at: `${date}T09:00:00Z`,
})

const lot = (asset: AssetItem, [ago, qty, price]: [number, number, number]) =>
  entry(asset, daysAgo(ago), qty > 0 ? 'add' : 'remove', Math.abs(qty), Math.abs(qty) * price, price)

const isTicker = (asset: AssetItem) => asset.total_quantity != null

/**
 * Oldest first. Ticker assets start with the units they were created with (the demo MSFT and Solana with the design's
 * purchases); the rest with their estimated price (the demo ones a month back, at the 1M chart's left edge).
 */
const historyOf = (asset: AssetItem) => {
  if (!history.has(asset.id)) {
    const start = asset.created_at.slice(0, 10)
    const demo = asset.portfolio_id === 'demo'
    const list =
      demo && asset.id === 'a1'
        ? MSFT_LOTS.map((l) => lot(asset, l))
        : demo && asset.id === 'a2'
          ? [lot(asset, SOL_LOT)]
          : [
              isTicker(asset)
                ? entry(asset, start, 'add', asset.total_quantity, asset.owned_value_converted, unitPrice(asset))
                : entry(asset, demo ? daysAgo(30) : start, 'price', null, asset.owned_value_converted, null),
            ]
    history.set(asset.id, list)
  }
  return history.get(asset.id)!
}

const byDate = (a: AssetHistoryEntry, b: AssetHistoryEntry) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at)

/** Ticker assets: what went in less what came out. The rest: the first price. */
const investedIn = (entries: AssetHistoryEntry[]) => {
  const prices = entries.filter((e) => e.kind === 'price').sort(byDate)
  if (prices.length) return prices[0].amount
  return entries.reduce((sum, e) => sum + (e.kind === 'add' ? e.amount : -e.amount), 0)
}

/** Newest first, as the History tab lists them. */
const mockHistory = (portfolioId: string, assetId: string) => later([...historyOf(find(portfolioId, assetId))].sort((a, b) => byDate(b, a)))

const mockStats = (portfolioId: string, assetId: string): Promise<AssetStats> => {
  const asset = find(portfolioId, assetId)
  const invested = investedIn(historyOf(asset))
  const gain = asset.owned_value_converted - invested
  return later({ invested, gain, gain_pct: invested > 0 ? (gain / invested) * 100 : 0 })
}

/**
 * Adds or removes units (ticker assets, at today's price per unit) or an amount of money, and moves the asset's
 * units and value with it. Removing more than you hold is refused.
 */
const mockAddHistory = (portfolioId: string, assetId: string, input: AddAssetHistoryInput) => {
  const asset = find(portfolioId, assetId)
  const ticker = isTicker(asset)
  const price = ticker ? unitPrice(asset) : null
  const amount = ticker ? input.value * price! : input.value
  const sign = input.kind === 'add' ? 1 : -1
  if (input.kind === 'remove' && (ticker ? input.value > asset.total_quantity! : amount > asset.owned_value_converted))
    return Promise.reject(new Error('You can’t remove more than you hold'))

  const created = {
    ...entry(asset, input.date, input.kind, ticker ? input.value : null, amount, price),
    created_at: new Date().toISOString(),
  }
  historyOf(asset).push(created)
  Object.assign(asset, {
    total_quantity: ticker ? asset.total_quantity! + sign * input.value : null,
    owned_value_converted: asset.owned_value_converted + sign * amount,
    updated_at: new Date().toISOString(),
  })
  return later(created)
}

/** Sets the value of an asset priced in money (real estate, a domain, …), noting the price before. */
const mockUpdatePrice = (portfolioId: string, assetId: string, input: UpdateAssetPriceInput) => {
  const asset = find(portfolioId, assetId)
  const created = {
    ...entry(asset, input.date, 'price', null, input.value, null, asset.owned_value_converted),
    created_at: new Date().toISOString(),
  }
  historyOf(asset).push(created)
  Object.assign(asset, { owned_value_converted: input.value, updated_at: new Date().toISOString() })
  return later(created)
}

/**
 * The asset's value across a period. Ticker assets: units held on each day × a price that wanders around today's —
 * as far as the asset has gained or lost overall, so one bought at today's price draws flat. The rest: the latest
 * price on each day.
 */
const mockChart = (portfolioId: string, assetId: string, period: ChartPeriod) => {
  const asset = find(portfolioId, assetId)
  const entries = historyOf(asset)
  const price = unitPrice(asset)
  const seed = [...asset.id].reduce((sum, c) => sum + c.charCodeAt(0), 0)
  const prices = entries.filter((e) => e.kind === 'price').sort(byDate)
  const invested = investedIn(entries)
  const swing = invested > 0 ? Math.min(1, Math.abs(asset.owned_value_converted - invested) / invested / 0.1) : 0
  const end = Date.now()
  const span = periodDays(period) * 86_400_000
  const points = Array.from({ length: CHART_POINTS }, (_, i) => {
    const at = new Date(end - span + (span * i) / (CHART_POINTS - 1))
    const day = isoDay(at)
    const held = prices.length
      ? (prices.findLast((e) => e.date <= day)?.amount ?? 0)
      : entries.filter((e) => e.date <= day).reduce((sum, e) => sum + (e.kind === 'add' ? 1 : -1) * (e.quantity ?? e.amount), 0)
    const left = CHART_POINTS - 1 - i // 0 at today, so the line ends on the current value
    const wobble = left === 0 ? 1 : 1 + swing * (0.06 * Math.sin((i + seed) * 0.45) + 0.03 * Math.sin((i + seed) * 1.3))
    const value = isTicker(asset) ? held * price * wobble : held
    return { date: period === '1D' ? at.toISOString() : day, value: Math.max(0, Number(value.toFixed(2))) }
  })
  return later(points)
}

// ─── Reporting ────────────────────────────────────────────────────────────────

/** Investable or not, and the share you own (the value scales with it). */
const mockUpdate = (portfolioId: string, assetId: string, patch: { investability?: Investability; ownership_pct?: number }) => {
  const asset = find(portfolioId, assetId)
  if (patch.ownership_pct != null && patch.ownership_pct !== asset.ownership_pct) {
    const whole = asset.ownership_pct > 0 ? asset.owned_value_converted / (asset.ownership_pct / 100) : asset.owned_value_converted
    asset.owned_value_converted = (whole * patch.ownership_pct) / 100
    asset.ownership_pct = patch.ownership_pct
  }
  if (patch.investability) asset.investability = patch.investability
  asset.updated_at = new Date().toISOString()
  return later({ ...asset })
}

// ─── Auto-Pilot ───────────────────────────────────────────────────────────────

const rule = (assetId: string, action: AssetRule['action'], frequency: AssetRule['frequency'], from: number, to: number): AssetRule => ({
  id: crypto.randomUUID(),
  asset_id: assetId,
  action,
  amount: 100,
  frequency,
  start_date: daysAgo(from),
  end_date: daysAgo(-to),
  is_active: true,
  created_at: `${daysAgo(from)}T09:00:00Z`,
})

// The design's four MSFT rules.
let rules: AssetRule[] = [
  rule('a1', 'add', 'daily', 20, 40),
  rule('a1', 'remove', 'weekly', 30, 30),
  rule('a1', 'add', 'daily', 20, 40),
  rule('a1', 'add', 'daily', 20, 40),
]

const mockRules = (assetId: string) => later(rules.filter((r) => r.asset_id === assetId))

/** Adds a rule, or updates one (`ruleId`); a new rule starts active. */
const mockSaveRule = (assetId: string, { ruleId, ...input }: AssetRuleInput & { ruleId?: string }) => {
  if (ruleId) rules = rules.map((r) => (r.id === ruleId ? { ...r, ...input } : r))
  else rules = [{ id: crypto.randomUUID(), asset_id: assetId, is_active: true, created_at: new Date().toISOString(), ...input }, ...rules]
  return later(null)
}

const mockToggleRule = (ruleId: string) => {
  rules = rules.map((r) => (r.id === ruleId ? { ...r, is_active: !r.is_active } : r))
  return later(null)
}

const mockDeleteRule = (ruleId: string) => {
  rules = rules.filter((r) => r.id !== ruleId)
  return later(null)
}

// ─── Notes ────────────────────────────────────────────────────────────────────

const BELIEF = 'I believe it will outperform by Q4 2026, and has a long-term return potential'
const note = (title: string, tags: string[]): AssetNote => ({
  id: crypto.randomUUID(),
  asset_id: 'a1',
  title,
  content: BELIEF,
  tags,
  created_at: `${daysAgo(2)}T10:00:00Z`,
})
let notes: AssetNote[] = [note('Why I bought this?', ['Strategy', 'Long-Term']), note('', ['Strategy', 'Long-Term']), note('', [])]

const mockNotes = (assetId: string) => later(notes.filter((n) => n.asset_id === assetId))

const mockSaveNote = (assetId: string, { noteId, ...input }: AssetNoteInput & { noteId?: string }) => {
  if (noteId) notes = notes.map((n) => (n.id === noteId ? { ...n, ...input } : n))
  else notes = [{ id: crypto.randomUUID(), asset_id: assetId, created_at: new Date().toISOString(), ...input }, ...notes]
  return later(null)
}

const mockDeleteNote = (noteId: string) => {
  notes = notes.filter((n) => n.id !== noteId)
  return later(null)
}

// ─── Documents ────────────────────────────────────────────────────────────────

let documents: AssetDocument[] = []
const files = new Map<string, Blob>()

const mockDocuments = (assetId: string) => later(documents.filter((d) => d.asset_id === assetId))

/** Uploads in steps, reporting each (0–1); abort with `signal`. */
const mockUpload = (assetId: string, file: File, onProgress: (progress: number) => void, signal?: AbortSignal) =>
  new Promise<AssetDocument>((resolve, reject) => {
    let progress = 0
    const timer = setInterval(() => {
      progress = Math.min(1, progress + 0.1)
      onProgress(progress)
      if (progress < 1) return
      clearInterval(timer)
      const doc = {
        id: crypto.randomUUID(),
        asset_id: assetId,
        file_name: file.name,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
      }
      files.set(doc.id, file)
      documents = [doc, ...documents]
      resolve(doc)
    }, 250)
    signal?.addEventListener('abort', () => {
      clearInterval(timer)
      reject(new DOMException('Upload cancelled', 'AbortError'))
    })
  })

const mockDocumentUrl = (doc: Pick<AssetDocument, 'id' | 'file_name'>) =>
  Promise.resolve(URL.createObjectURL(files.get(doc.id) ?? new Blob([`${doc.file_name} (sample document)`], { type: 'text/plain' })))

const mockDeleteDocument = (docId: string) => {
  documents = documents.filter((d) => d.id !== docId)
  files.delete(docId)
  return later(null)
}

// ─── API ──────────────────────────────────────────────────────────────────────
// The panel shows money in the portfolio's currency, owned share only, like the table. The API keeps an asset's
// prices in its own currency for the whole asset, so values are converted on the way in and out.
// TODO: the API can't yet remove units or date a price change. (Rules, notes and documents: see lib/item-api.)

interface ApiLot {
  quantity: number
  acquisition_price: number | null
  acquisition_date: string
  created_at: string
  id: string
}

interface ApiAssetDetail extends ApiAsset {
  currency: string
  current_price: number
  exchange_rate: number
  lots?: ApiLot[]
}

interface ApiValuePoint {
  id: string
  value: number
  recorded_at: string
}

const base = (portfolioId: string, assetId: string) => `/portfolios/${portfolioId}/assets/${assetId}`
const getDetail = (portfolioId: string, assetId: string) => api<ApiAssetDetail>(base(portfolioId, assetId))

/** Native whole-asset amounts → the portfolio's currency, owned share. */
const toOwned = (a: ApiAssetDetail) => (amount: number) => amount * (a.exchange_rate || 1) * (a.ownership_pct / 100)
const heldInUnits = (a: ApiAssetDetail) => toAssetItem(a).total_quantity != null

/**
 * Units bought (ticker assets: one entry per purchase), or the asset's value: what it was bought at, then each price
 * change. Oldest first.
 */
async function apiHistory(portfolioId: string, assetId: string) {
  const a = await getDetail(portfolioId, assetId)
  const owned = toOwned(a)
  const lots = [...(a.lots ?? [])].sort((x, y) => x.acquisition_date.localeCompare(y.acquisition_date))
  const entry = (id: string, date: string, created_at: string, rest: Partial<AssetHistoryEntry>): AssetHistoryEntry => ({
    id,
    asset_id: assetId,
    date: date.slice(0, 10),
    kind: 'price',
    quantity: null,
    amount: 0,
    price: null,
    previous: null,
    created_at,
    ...rest,
  })
  if (heldInUnits(a)) {
    return {
      asset: a,
      entries: lots.map((l) => {
        const price = l.acquisition_price ?? a.current_price
        return entry(l.id, l.acquisition_date, l.created_at, {
          kind: 'add',
          quantity: l.quantity,
          amount: owned(l.quantity * price),
          price: owned(price),
        })
      }),
    }
  }
  const from = new Date(0).toISOString()
  const points = (await api<ApiValuePoint[] | null>(`${base(portfolioId, assetId)}/value-history`, { params: { from } })) ?? []
  const first = lots[0]
  const prices = [
    ...(first
      ? [entry(first.id, first.acquisition_date, first.created_at, { amount: owned(first.quantity * (first.acquisition_price ?? 0)) })]
      : []),
    ...[...points]
      .sort((x, y) => x.recorded_at.localeCompare(y.recorded_at))
      .map((p) => entry(p.id, p.recorded_at, p.recorded_at, { amount: owned(p.value) })),
  ]
  return { asset: a, entries: prices.map((e, i) => (i ? { ...e, previous: prices[i - 1].amount } : e)) }
}

/** Ticker assets: what the purchases cost. The rest: what it was bought at. */
const invested = (entries: AssetHistoryEntry[]) =>
  entries.some((e) => e.kind === 'price') ? (entries[0]?.amount ?? 0) : entries.reduce((sum, e) => sum + e.amount, 0)

/** Today's owned value at each of the period's points: units held then × today's price, or the price then. */
function apiChart(a: ApiAssetDetail, entries: AssetHistoryEntry[], period: ChartPeriod) {
  const value = toAssetItem(a).owned_value_converted
  const units = heldInUnits(a)
  const unitValue = a.quantity ? value / a.quantity : 0
  const end = Date.now()
  const span = periodDays(period) * 86_400_000
  return Array.from({ length: CHART_POINTS }, (_, i) => {
    const at = new Date(end - span + (span * i) / (CHART_POINTS - 1))
    const day = isoDay(at)
    const held = units
      ? entries.filter((e) => e.date <= day).reduce((sum, e) => sum + (e.quantity ?? 0), 0) * unitValue
      : (entries.findLast((e) => e.date <= day)?.amount ?? 0)
    // The line ends on today's value, which already counts any change not in the history.
    return { date: period === '1D' ? at.toISOString() : day, value: i === CHART_POINTS - 1 ? value : Number(held.toFixed(2)) }
  })
}

/** Sets the whole asset's unit price so its owned value becomes `value` (in the portfolio's currency). */
const setOwnedValue = (portfolioId: string, a: ApiAssetDetail, value: number) =>
  api<ApiAsset>(base(portfolioId, a.id), {
    method: 'PATCH',
    body: { current_price: value / ((a.exchange_rate || 1) * (a.ownership_pct / 100) * (a.quantity || 1)) },
  })

const toRule = (r: ApiRule): AssetRule => ({
  id: r.id,
  asset_id: r.target_id,
  action: r.action,
  amount: r.units ?? r.amount,
  frequency: r.frequency,
  ...ruleDays(r),
  is_active: r.is_active,
  created_at: r.created_at,
})
const isMockRule = (ruleId: string) => rules.some((r) => r.id === ruleId)

const toNote = (n: ApiNote & { asset_id: string }): AssetNote => ({
  id: n.id,
  asset_id: n.asset_id,
  title: n.title,
  content: n.content,
  tags: noteTags(n),
  created_at: n.created_at,
})

const toDocument = ({ id, asset_id, file_name, file_size, uploaded_at }: ApiDocument & { asset_id: string }): AssetDocument => ({
  id,
  asset_id,
  file_name,
  file_size,
  uploaded_at,
})

// ─── Exports: the API for real assets, the mocks for the rest ─────────────────

/** Whether units can be taken off a ticker asset: only mocked ones, until the API can remove units. */
export const canRemoveUnits = (portfolioId: string, assetId: string) => isMockedAsset(portfolioId, assetId)

/** Newest first, as the History tab lists them. */
export const listAssetHistory = async (portfolioId: string, assetId: string) => {
  if (isMockedAsset(portfolioId, assetId)) return mockHistory(portfolioId, assetId)
  return (await apiHistory(portfolioId, assetId)).entries.reverse()
}

export const getAssetStats = async (portfolioId: string, assetId: string): Promise<AssetStats> => {
  if (isMockedAsset(portfolioId, assetId)) return mockStats(portfolioId, assetId)
  const { asset, entries } = await apiHistory(portfolioId, assetId)
  const spent = invested(entries)
  const gain = toAssetItem(asset).owned_value_converted - spent
  return { invested: spent, gain, gain_pct: spent > 0 ? (gain / spent) * 100 : 0 }
}

/**
 * Adds units (ticker assets, as a purchase on that date) or adds/removes an amount of money (the rest, as a new
 * price). Removing units isn't in the API yet.
 */
export const addAssetHistory = async (portfolioId: string, assetId: string, input: AddAssetHistoryInput) => {
  if (isMockedAsset(portfolioId, assetId)) return mockAddHistory(portfolioId, assetId, input)
  const a = await getDetail(portfolioId, assetId)
  if (!heldInUnits(a)) {
    const value = toAssetItem(a).owned_value_converted
    if (input.kind === 'remove' && input.value > value) throw new Error('You can’t remove more than you hold')
    return setOwnedValue(portfolioId, a, value + (input.kind === 'add' ? input.value : -input.value))
  }
  if (input.kind === 'remove') throw new Error('Removing units isn’t available yet. Add a purchase or update the price instead.')
  // A listed stock is priced on the date by the API; otherwise (or if it can't) at today's price.
  const lot = (price?: number) => ({ quantity: input.value, acquisition_date: input.date, acquisition_price: price })
  const add = (price?: number) => api(`${base(portfolioId, assetId)}/lots`, { method: 'POST', body: lot(price) })
  if (a.asset_type !== 'stock_ticker') return add(a.current_price)
  try {
    return await add()
  } catch (err) {
    if (!(err instanceof ApiError && err.code === 'ACQUISITION_PRICE_REQUIRED')) throw err
    return add(a.current_price)
  }
}

/** Sets the value of an asset priced in money (real estate, a domain, …). The API records it as of today. */
export const updateAssetPrice = async (portfolioId: string, assetId: string, input: UpdateAssetPriceInput) => {
  if (isMockedAsset(portfolioId, assetId)) return mockUpdatePrice(portfolioId, assetId, input)
  return setOwnedValue(portfolioId, await getDetail(portfolioId, assetId), input.value)
}

export const getAssetChart = async (portfolioId: string, assetId: string, period: ChartPeriod) => {
  if (isMockedAsset(portfolioId, assetId)) return mockChart(portfolioId, assetId, period)
  const { asset, entries } = await apiHistory(portfolioId, assetId)
  return apiChart(asset, entries, period)
}

/** Investable or not, and the share you own (the value scales with it). */
export const updateAsset = async (
  portfolioId: string,
  assetId: string,
  patch: { investability?: Investability; ownership_pct?: number },
) => {
  if (isMockedAsset(portfolioId, assetId)) return mockUpdate(portfolioId, assetId, patch)
  return toAssetItem(await api<ApiAsset>(base(portfolioId, assetId), { method: 'PATCH', body: patch }))
}

export const listAssetRules = async (portfolioId: string, assetId: string) => {
  if (isMockedAsset(portfolioId, assetId)) return mockRules(assetId)
  return (await listRules(portfolioId, 'asset', assetId)).map(toRule)
}

/** Adds a rule, or updates one (`ruleId`: remade, since the API can't edit one). A new rule starts active. */
export const saveAssetRule = async (portfolioId: string, assetId: string, { ruleId, ...input }: AssetRuleInput & { ruleId?: string }) => {
  if (isMockedAsset(portfolioId, assetId)) return mockSaveRule(assetId, { ruleId, ...input })
  const units = heldInUnits(await getDetail(portfolioId, assetId))
  await createRule(portfolioId, {
    target_id: assetId,
    target_type: 'asset',
    action: input.action,
    ...(units ? { units: input.amount } : { amount: input.amount }),
    frequency: input.frequency,
    start_date: input.start_date,
    end_date: input.end_date,
  })
  if (ruleId) await deleteRule(portfolioId, ruleId)
  return null
}

export const toggleAssetRule = async (portfolioId: string, ruleId: string) => {
  if (isMockRule(ruleId)) return mockToggleRule(ruleId)
  await toggleRule(portfolioId, ruleId)
  return null
}

export const deleteAssetRule = async (portfolioId: string, ruleId: string) => {
  if (isMockRule(ruleId)) return mockDeleteRule(ruleId)
  await deleteRule(portfolioId, ruleId)
  return null
}

export const listAssetNotes = async (portfolioId: string, assetId: string) => {
  if (isMockedAsset(portfolioId, assetId)) return mockNotes(assetId)
  return ((await api<Array<ApiNote & { asset_id: string }> | null>(`${base(portfolioId, assetId)}/notes`)) ?? []).map(toNote)
}

export const saveAssetNote = async (portfolioId: string, assetId: string, { noteId, ...input }: AssetNoteInput & { noteId?: string }) => {
  if (isMockedAsset(portfolioId, assetId)) return mockSaveNote(assetId, { noteId, ...input })
  const body = noteBody(input)
  await api(`${base(portfolioId, assetId)}/notes${noteId ? `/${noteId}` : ''}`, { method: noteId ? 'PATCH' : 'POST', body })
  return null
}

export const deleteAssetNote = async (portfolioId: string, assetId: string, noteId: string) => {
  if (isMockedAsset(portfolioId, assetId)) return mockDeleteNote(noteId)
  await api(`${base(portfolioId, assetId)}/notes/${noteId}`, { method: 'DELETE' })
  return null
}

export const listAssetDocuments = async (portfolioId: string, assetId: string) => {
  if (isMockedAsset(portfolioId, assetId)) return mockDocuments(assetId)
  return ((await api<Array<ApiDocument & { asset_id: string }> | null>(`${base(portfolioId, assetId)}/documents`)) ?? []).map(toDocument)
}

/** Uploads, reporting each step (0–1); abort with `signal`. */
export const uploadAssetDocument = async (
  portfolioId: string,
  assetId: string,
  file: File,
  onProgress: (progress: number) => void,
  signal?: AbortSignal,
) => {
  if (isMockedAsset(portfolioId, assetId)) return mockUpload(assetId, file, onProgress, signal)
  const path = `${base(portfolioId, assetId)}/documents`
  return toDocument(await uploadWithProgress<ApiDocument & { asset_id: string }>(path, file, onProgress, signal))
}

/** A link to open the file: a short-lived signed URL from the API, or the mock's local copy. */
export const getAssetDocumentUrl = async (portfolioId: string, assetId: string, doc: Pick<AssetDocument, 'id' | 'file_name'>) => {
  if (isMockedAsset(portfolioId, assetId)) return mockDocumentUrl(doc)
  return (await api<{ url: string }>(`${base(portfolioId, assetId)}/documents/${doc.id}/download-url`)).url
}

export const deleteAssetDocument = async (portfolioId: string, assetId: string, docId: string) => {
  if (isMockedAsset(portfolioId, assetId)) return mockDeleteDocument(docId)
  await api(`${base(portfolioId, assetId)}/documents/${docId}`, { method: 'DELETE' })
  return null
}
