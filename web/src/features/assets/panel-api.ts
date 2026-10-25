import { periodDays, type ChartPeriod } from '@/lib/periods'
import { assetsOf } from './api'
import type {
  AddAssetHistoryInput,
  AssetDocument,
  AssetHistoryEntry,
  AssetItem,
  AssetNote,
  AssetNoteInput,
  AssetRule,
  AssetStats,
  Investability,
} from './types'

// TODO: mocked — the backend has no endpoints for an asset's history, Auto-Pilot rules, notes or documents yet, and
// PATCH /portfolios/:id/assets/:assetId doesn't take investability or ownership. Changes live in memory; history
// moves the asset's units and value, so the table and header follow.
const DELAY = 400
const later = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY))
const CHART_POINTS = 40

const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return isoDay(d)
}

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

const history = new Map<string, AssetHistoryEntry[]>()

const entry = (
  asset: AssetItem,
  date: string,
  kind: AssetHistoryEntry['kind'],
  quantity: number | null,
  amount: number,
  price: number | null,
) => ({
  id: crypto.randomUUID(),
  asset_id: asset.id,
  date,
  kind,
  quantity,
  amount,
  price,
  created_at: `${date}T09:00:00Z`,
})

/** Oldest first. Each asset starts with what it was created with (the demo MSFT with the design's purchases). */
const historyOf = (asset: AssetItem) => {
  if (!history.has(asset.id)) {
    const start = asset.created_at.slice(0, 10)
    const list =
      asset.portfolio_id === 'demo' && asset.id === 'a1'
        ? MSFT_LOTS.map(([ago, qty, price]) =>
            entry(asset, daysAgo(ago), qty > 0 ? 'add' : 'remove', Math.abs(qty), Math.abs(qty) * price, price),
          )
        : [
            asset.total_quantity
              ? entry(asset, start, 'add', asset.total_quantity, asset.owned_value_converted, unitPrice(asset))
              : entry(asset, start, 'add', null, asset.owned_value_converted, null),
          ]
    history.set(asset.id, list)
  }
  return history.get(asset.id)!
}

/** Newest first, as the History tab lists them. */
export const listAssetHistory = (portfolioId: string, assetId: string) =>
  later([...historyOf(find(portfolioId, assetId))].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)))

export const getAssetStats = (portfolioId: string, assetId: string): Promise<AssetStats> => {
  const asset = find(portfolioId, assetId)
  const invested = historyOf(asset).reduce((sum, e) => sum + (e.kind === 'add' ? e.amount : -e.amount), 0)
  const gain = asset.owned_value_converted - invested
  return later({ invested, gain, gain_pct: invested > 0 ? (gain / invested) * 100 : 0 })
}

/**
 * Adds or removes units (ticker assets, at today's price per unit) or an amount of money, and moves the asset's
 * units and value with it. Removing more than you hold is refused.
 */
export const addAssetHistory = (portfolioId: string, assetId: string, input: AddAssetHistoryInput) => {
  const asset = find(portfolioId, assetId)
  const ticker = asset.total_quantity != null
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

/**
 * The asset's value across a period. Ticker assets: units held on each day × a price that wanders around today's;
 * others step with their history.
 */
export const getAssetChart = (portfolioId: string, assetId: string, period: ChartPeriod) => {
  const asset = find(portfolioId, assetId)
  const entries = historyOf(asset)
  const price = unitPrice(asset)
  const seed = [...asset.id].reduce((sum, c) => sum + c.charCodeAt(0), 0)
  const end = Date.now()
  const span = periodDays(period) * 86_400_000
  const points = Array.from({ length: CHART_POINTS }, (_, i) => {
    const at = new Date(end - span + (span * i) / (CHART_POINTS - 1))
    const day = isoDay(at)
    const held = entries.filter((e) => e.date <= day).reduce((sum, e) => sum + (e.kind === 'add' ? 1 : -1) * (e.quantity ?? e.amount), 0)
    const left = CHART_POINTS - 1 - i // 0 at today, so the line ends on the current value
    const wobble = left === 0 ? 1 : 1 + 0.06 * Math.sin((i + seed) * 0.45) + 0.03 * Math.sin((i + seed) * 1.3)
    const value = asset.total_quantity != null ? held * price * wobble : held
    return { date: period === '1D' ? at.toISOString() : day, value: Math.max(0, Number(value.toFixed(2))) }
  })
  return later(points)
}

// ─── Reporting ────────────────────────────────────────────────────────────────

/** Investable or not, and the share you own (the value scales with it). */
export const updateAsset = (portfolioId: string, assetId: string, patch: { investability?: Investability; ownership_pct?: number }) => {
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

export const listAssetRules = (assetId: string) => later(rules.filter((r) => r.asset_id === assetId))

export const toggleAssetRule = (ruleId: string) => {
  rules = rules.map((r) => (r.id === ruleId ? { ...r, is_active: !r.is_active } : r))
  return later(null)
}

export const deleteAssetRule = (ruleId: string) => {
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

export const listAssetNotes = (assetId: string) => later(notes.filter((n) => n.asset_id === assetId))

export const saveAssetNote = (assetId: string, { noteId, ...input }: AssetNoteInput & { noteId?: string }) => {
  if (noteId) notes = notes.map((n) => (n.id === noteId ? { ...n, ...input } : n))
  else notes = [{ id: crypto.randomUUID(), asset_id: assetId, created_at: new Date().toISOString(), ...input }, ...notes]
  return later(null)
}

export const deleteAssetNote = (noteId: string) => {
  notes = notes.filter((n) => n.id !== noteId)
  return later(null)
}

// ─── Documents ────────────────────────────────────────────────────────────────

let documents: AssetDocument[] = []
const files = new Map<string, Blob>()

export const listAssetDocuments = (assetId: string) => later(documents.filter((d) => d.asset_id === assetId))

/** Uploads in steps, reporting each (0–1); abort with `signal`. */
export const uploadAssetDocument = (assetId: string, file: File, onProgress: (progress: number) => void, signal?: AbortSignal) =>
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

export const getAssetDocumentUrl = (doc: Pick<AssetDocument, 'id' | 'file_name'>) =>
  Promise.resolve(URL.createObjectURL(files.get(doc.id) ?? new Blob([`${doc.file_name} (sample document)`], { type: 'text/plain' })))

export const deleteAssetDocument = (docId: string) => {
  documents = documents.filter((d) => d.id !== docId)
  files.delete(docId)
  return later(null)
}
