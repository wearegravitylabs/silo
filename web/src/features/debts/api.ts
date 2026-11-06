import { api } from '@/lib/api-client'
import { isDemoPortfolio } from '@/lib/demo'
import { defaultFolderId, fromApiFolderId } from '@/lib/folders'
import {
  createRule,
  deleteRule,
  getRule,
  listRules,
  noteBody,
  noteTags,
  ruleDays,
  toggleRule,
  type ApiDocument,
  type ApiNote,
  type ApiRule,
} from '@/lib/item-api'
import { mockDelay } from '@/lib/mock'
import { periodDays, type ChartPeriod } from '@/lib/periods'
import { emptyOverview, MOCK_DEBTS, MOCK_DOCUMENTS, MOCK_HISTORY, MOCK_NOTES, MOCK_OVERVIEW, MOCK_RULES } from './mock-data'
import type {
  CreateDebtInput,
  Debt,
  DebtDocument,
  DebtHistoryEntry,
  DebtNote,
  DebtNoteInput,
  DebtRule,
  DebtRuleInput,
  DebtsOverview,
} from './types'

// Real portfolios use the API; the demo portfolios (see lib/demo) stay in memory, starting with the design's debts.
// TODO: the API's debts lack change_pct_1m, needs_attention and an icon (null/false here: the type's icon shows), and
// there's no debts overview: the total is added up here, without its 1M change.
const later = mockDelay(600)

const store = new Map<string, Debt[]>()
const debtsOf = (portfolioId: string) => {
  if (!store.has(portfolioId)) store.set(portfolioId, portfolioId === 'demo' ? [...MOCK_DEBTS] : [])
  return store.get(portfolioId)!
}
/** Balances added in this session, on top of the demo's fixed design total. */
const added = new Map<string, number>()

// ─── API shapes ───────────────────────────────────────────────────────────────

type ApiDebt = Omit<Debt, 'folder_id' | 'change_pct_1m' | 'needs_attention' | 'icon' | 'start_date' | 'payoff_date'> & {
  folder_id?: string | null
  start_date?: string | null
  payoff_date?: string | null
}

const toDebt = (d: ApiDebt): Debt => ({
  ...d,
  folder_id: fromApiFolderId(d.folder_id),
  frequency: d.frequency ?? '',
  start_date: d.start_date ?? null,
  payoff_date: d.payoff_date ?? null,
  change_pct_1m: null,
  needs_attention: false,
  icon: null,
})

const debtsPath = (portfolioId: string) => `/portfolios/${portfolioId}/debts`

/** Units of each currency per US dollar, the API's cached FX table; just USD if it can't be had. */
async function usdRates() {
  const rows = await api<Array<{ currency: string; rate: number }> | null>('/exchange-rates').catch(() => null)
  return new Map([['USD', 1], ...(rows ?? []).map((r) => [r.currency.toUpperCase(), r.rate] as [string, number])])
}

// ─── Debts page ───────────────────────────────────────────────────────────────

/** The portfolio's debt total (owned share) in its base currency, and the 1M change (demo only, for now). */
export const getDebtsOverview = async (portfolioId: string, currency: string): Promise<DebtsOverview> => {
  if (!isDemoPortfolio(portfolioId)) {
    const [debts, rates] = await Promise.all([api<ApiDebt[] | null>(debtsPath(portfolioId)), usdRates()])
    const to = rates.get(currency.toUpperCase()) ?? 1
    // A currency without a rate is counted as is.
    const total = (debts ?? []).reduce((sum, d) => sum + (d.owned_balance * to) / (rates.get(d.currency.toUpperCase()) ?? to), 0)
    return { currency, total, change: null }
  }
  const extra = added.get(portfolioId) ?? 0
  if (portfolioId === 'demo') return later({ ...MOCK_OVERVIEW, total: MOCK_OVERVIEW.total + extra })
  // A new portfolio's debt all arrived this month: the change is the whole total (+100%).
  return later(extra > 0 ? { currency, total: extra, change: { amount: extra, pct: 100 } } : emptyOverview(currency))
}

/** A folder's debts; no folder (or the demo's "All Debts") lists every debt in the portfolio. */
export const listDebts = async (portfolioId: string, folderId?: string): Promise<Debt[]> => {
  const all = !folderId || folderId === defaultFolderId('debt')
  if (!isDemoPortfolio(portfolioId)) {
    // Filtered here: the API rejects ?folder_id= on debts (its query binder can't parse the UUID). TODO: backend fix.
    const list = ((await api<ApiDebt[] | null>(debtsPath(portfolioId))) ?? []).map(toDebt)
    return all ? list : list.filter((d) => d.folder_id === folderId)
  }
  const debts = debtsOf(portfolioId)
  return later(all ? [...debts] : debts.filter((d) => d.folder_id === folderId))
}

/**
 * Files a deleted folder's debts in `to` (the default folder unfiles them). Demo only: the API's are moved before the
 * folder is deleted (see the folders feature).
 */
export const refileDebtFolder = (portfolioId: string, from: string, to: string) => {
  const folderId = to === defaultFolderId('debt') ? null : to
  const list = debtsOf(portfolioId)
  list.forEach((d, i) => d.folder_id === from && (list[i] = { ...d, folder_id: folderId }))
  return later(null)
}

/** Adds a debt at its balance (what's owed now is also what was borrowed). A real one goes in a folder. */
export const createDebt = async (portfolioId: string, input: CreateDebtInput): Promise<Debt> => {
  if (!isDemoPortfolio(portfolioId)) {
    if (!input.folder_id) throw new Error('Create a folder for this debt first')
    const { icon: _icon, frequency, ...rest } = input
    const body = { ...rest, principal: input.balance, frequency: frequency || undefined }
    return toDebt(await api<ApiDebt>(debtsPath(portfolioId), { method: 'POST', body }))
  }
  const now = new Date().toISOString()
  const debt: Debt = {
    id: crypto.randomUUID(),
    portfolio_id: portfolioId,
    principal: input.balance,
    owned_balance: input.balance,
    ownership_pct: 100,
    start_date: null,
    payoff_date: null,
    created_at: now,
    updated_at: now,
    change_pct_1m: null,
    needs_attention: false,
    ...input,
    folder_id: input.folder_id === defaultFolderId('debt') ? null : input.folder_id,
  }
  debtsOf(portfolioId).push(debt)
  added.set(portfolioId, (added.get(portfolioId) ?? 0) + input.balance)
  return later(debt)
}

export const deleteDebt = async (portfolioId: string, debtId: string) => {
  if (!isDemoPortfolio(portfolioId)) {
    await api(`${debtsPath(portfolioId)}/${debtId}`, { method: 'DELETE' })
    return null
  }
  const list = debtsOf(portfolioId)
  const i = list.findIndex((d) => d.id === debtId)
  if (i !== -1) {
    added.set(portfolioId, (added.get(portfolioId) ?? 0) - list[i].owned_balance)
    list.splice(i, 1)
  }
  return later(null)
}

// ─── Detail panel: mocks (the demo portfolios) ────────────────────────────────

const CHART_POINTS = 30
const history = [...MOCK_HISTORY]
const rules = [...MOCK_RULES]
const notes = [...MOCK_NOTES]
const documents = [...MOCK_DOCUMENTS]
/** Uploaded files, so Download hands back what was uploaded. */
const files = new Map<string, File>()

const now = () => new Date().toISOString()
const newest = <T extends { created_at: string }>(list: T[]) => [...list].sort((a, b) => b.created_at.localeCompare(a.created_at))

function findDebt(debtId: string) {
  for (const list of store.values()) {
    const debt = list.find((d) => d.id === debtId)
    if (debt) return debt
  }
  return MOCK_DEBTS.find((d) => d.id === debtId)
}

/** A debt's entries, oldest first; debts without any start from their opening balance. */
function mockEntries(debtId: string) {
  if (!history.some((h) => h.debt_id === debtId)) {
    const debt = findDebt(debtId)
    if (debt) {
      const date = debt.created_at.slice(0, 10)
      history.push({
        id: crypto.randomUUID(),
        debt_id: debtId,
        kind: 'initial',
        date,
        balance: debt.principal,
        previous: null,
        created_at: debt.created_at,
      })
    }
  }
  return history
    .filter((h) => h.debt_id === debtId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at))
}

/** The balance across a period from entries (oldest first): each day takes the latest entry on or before it. */
function chartOf(entries: DebtHistoryEntry[], period: ChartPeriod) {
  const end = Date.now()
  const span = periodDays(period) * 86_400_000
  return Array.from({ length: CHART_POINTS }, (_, i) => {
    const at = new Date(end - span + (span * i) / (CHART_POINTS - 1))
    const day = at.toISOString().slice(0, 10)
    const entry = [...entries].reverse().find((e) => e.date <= day) ?? entries[0]
    return { date: period === '1D' ? at.toISOString() : day, value: entry?.balance ?? 0 }
  })
}

/** Records a balance change and moves the debt (table, header total) to the new balance. */
function mockRecordBalance(debtId: string, kind: 'adjustment' | 'repayment', balance: number, date: string) {
  const debt = findDebt(debtId)
  const previous = debt?.owned_balance ?? 0
  history.push({ id: crypto.randomUUID(), debt_id: debtId, kind, date, balance, previous, created_at: now() })
  if (debt) {
    debt.balance = balance
    debt.owned_balance = balance
    debt.updated_at = now()
    added.set(debt.portfolio_id, (added.get(debt.portfolio_id) ?? 0) + balance - previous)
  }
  return later(null)
}

const mockSaveRule = (debtId: string, { ruleId, ...input }: DebtRuleInput & { ruleId?: string }) => {
  const existing = ruleId ? rules.find((r) => r.id === ruleId) : undefined
  if (existing) Object.assign(existing, input)
  else rules.push({ id: crypto.randomUUID(), debt_id: debtId, action: 'payment', is_active: true, created_at: now(), ...input })
  return later(null)
}

const mockToggleRule = (ruleId: string) => {
  const rule = rules.find((r) => r.id === ruleId)
  if (rule) rule.is_active = !rule.is_active
  return later(null)
}

const mockDeleteRule = (ruleId: string) => {
  const i = rules.findIndex((r) => r.id === ruleId)
  if (i !== -1) rules.splice(i, 1)
  return later(null)
}

const mockSaveNote = (debtId: string, { noteId, ...input }: DebtNoteInput & { noteId?: string }) => {
  const existing = noteId ? notes.find((n) => n.id === noteId) : undefined
  if (existing) Object.assign(existing, input)
  else notes.push({ id: crypto.randomUUID(), debt_id: debtId, created_at: now(), ...input })
  return later(null)
}

const mockDeleteNote = (noteId: string) => {
  const i = notes.findIndex((n) => n.id === noteId)
  if (i !== -1) notes.splice(i, 1)
  return later(null)
}

const mockUpload = (debtId: string, file: File) => {
  const doc: DebtDocument = { id: crypto.randomUUID(), debt_id: debtId, file_name: file.name, file_size: file.size, uploaded_at: now() }
  documents.push(doc)
  files.set(doc.id, file)
  return later(doc)
}

const mockDeleteDocument = (docId: string) => {
  const i = documents.findIndex((d) => d.id === docId)
  if (i !== -1) documents.splice(i, 1)
  files.delete(docId)
  return later(null)
}

// ─── Detail panel: API ────────────────────────────────────────────────────────
// The panel shows the debt's own currency, owned share, like the table; the API keeps the whole debt's balance.
// TODO: the API has no balance history, so a debt's history is worked out from it: what was borrowed (principal), then
// its balance now if it has changed. A repayment or adjustment just sets the balance, as of now (the date is dropped).

const debtPath = (portfolioId: string, debtId: string) => `${debtsPath(portfolioId)}/${debtId}`
const getDebt = async (portfolioId: string, debtId: string) => toDebt(await api<ApiDebt>(debtPath(portfolioId, debtId)))
const ownedShare = (d: Debt) => d.ownership_pct / 100

/** Oldest first: the opening balance, then today's if it differs. */
function apiEntries(d: Debt): DebtHistoryEntry[] {
  const opening = d.principal * ownedShare(d)
  const initial: DebtHistoryEntry = {
    id: `${d.id}:initial`,
    debt_id: d.id,
    kind: 'initial',
    date: (d.start_date ?? d.created_at).slice(0, 10),
    balance: opening,
    previous: null,
    created_at: d.created_at,
  }
  if (Math.abs(d.owned_balance - opening) < 0.005) return [initial]
  const current: DebtHistoryEntry = {
    id: `${d.id}:current`,
    debt_id: d.id,
    kind: 'adjustment',
    date: d.updated_at.slice(0, 10),
    balance: d.owned_balance,
    previous: opening,
    created_at: d.updated_at,
  }
  return [initial, current]
}

/** Sets the whole debt's balance so the owned share comes to `owned`. */
const setOwnedBalance = (portfolioId: string, d: Debt, owned: number) =>
  api(debtPath(portfolioId, d.id), { method: 'PATCH', body: { balance: owned / (ownedShare(d) || 1) } })

// Auto-Pilot pays a debt down ("remove" from its balance) or adds to it.
const toRule = (r: ApiRule): DebtRule => ({
  id: r.id,
  debt_id: r.target_id,
  action: r.action === 'remove' ? 'payment' : 'add',
  amount: r.amount,
  frequency: r.frequency,
  ...ruleDays(r),
  is_active: r.is_active,
  created_at: r.created_at,
})

const toNote = (n: ApiNote & { debt_id: string }): DebtNote => ({
  id: n.id,
  debt_id: n.debt_id,
  title: n.title,
  content: n.content,
  tags: noteTags(n),
  created_at: n.created_at,
})

const toDocument = ({ id, debt_id, file_name, file_size, uploaded_at }: ApiDocument & { debt_id: string }): DebtDocument => ({
  id,
  debt_id,
  file_name,
  file_size,
  uploaded_at,
})

// ─── Detail panel: exports (the API for real portfolios, the mocks for the demo) ─

/** Newest first, as the History tab lists them. */
export const listDebtHistory = async (portfolioId: string, debtId: string): Promise<DebtHistoryEntry[]> => {
  if (!isDemoPortfolio(portfolioId)) return apiEntries(await getDebt(portfolioId, debtId)).reverse()
  return later([...mockEntries(debtId)].reverse())
}

export const getDebtChart = async (portfolioId: string, debtId: string, period: ChartPeriod) => {
  if (!isDemoPortfolio(portfolioId)) return chartOf(apiEntries(await getDebt(portfolioId, debtId)), period)
  return later(chartOf(mockEntries(debtId), period))
}

/** A repayment lowers the balance by `amount` (not below zero). */
export const addDebtRepayment = async (portfolioId: string, debtId: string, { amount, date }: { amount: number; date: string }) => {
  if (!isDemoPortfolio(portfolioId)) {
    const d = await getDebt(portfolioId, debtId)
    await setOwnedBalance(portfolioId, d, Math.max(0, d.owned_balance - amount))
    return null
  }
  return mockRecordBalance(debtId, 'repayment', Math.max(0, (findDebt(debtId)?.owned_balance ?? 0) - amount), date)
}

/** Sets the balance to `amount`. */
export const adjustDebtBalance = async (portfolioId: string, debtId: string, { amount, date }: { amount: number; date: string }) => {
  if (!isDemoPortfolio(portfolioId)) {
    await setOwnedBalance(portfolioId, await getDebt(portfolioId, debtId), amount)
    return null
  }
  return mockRecordBalance(debtId, 'adjustment', amount, date)
}

export const listDebtRules = async (portfolioId: string, debtId: string): Promise<DebtRule[]> => {
  if (!isDemoPortfolio(portfolioId)) return newest((await listRules(portfolioId, 'debt', debtId)).map(toRule))
  return later(newest(rules.filter((r) => r.debt_id === debtId)))
}

/** Adds a repayment rule, or updates one (`ruleId`: remade with its action, since the API can't edit one). */
export const saveDebtRule = async (portfolioId: string, debtId: string, { ruleId, ...input }: DebtRuleInput & { ruleId?: string }) => {
  if (isDemoPortfolio(portfolioId)) return mockSaveRule(debtId, { ruleId, ...input })
  const action = ruleId ? (await getRule(portfolioId, ruleId)).action : 'remove'
  await createRule(portfolioId, { target_id: debtId, target_type: 'debt', action, ...input })
  if (ruleId) await deleteRule(portfolioId, ruleId)
  return null
}

export const toggleDebtRule = async (portfolioId: string, ruleId: string) => {
  if (isDemoPortfolio(portfolioId)) return mockToggleRule(ruleId)
  await toggleRule(portfolioId, ruleId)
  return null
}

export const deleteDebtRule = async (portfolioId: string, ruleId: string) => {
  if (isDemoPortfolio(portfolioId)) return mockDeleteRule(ruleId)
  await deleteRule(portfolioId, ruleId)
  return null
}

export const listDebtNotes = async (portfolioId: string, debtId: string): Promise<DebtNote[]> => {
  if (!isDemoPortfolio(portfolioId)) {
    const list = (await api<Array<ApiNote & { debt_id: string }> | null>(`${debtPath(portfolioId, debtId)}/notes`)) ?? []
    return newest(list.map(toNote))
  }
  return later(newest(notes.filter((n) => n.debt_id === debtId)))
}

export const saveDebtNote = async (portfolioId: string, debtId: string, { noteId, ...input }: DebtNoteInput & { noteId?: string }) => {
  if (isDemoPortfolio(portfolioId)) return mockSaveNote(debtId, { noteId, ...input })
  const path = `${debtPath(portfolioId, debtId)}/notes${noteId ? `/${noteId}` : ''}`
  await api(path, { method: noteId ? 'PATCH' : 'POST', body: noteBody(input) })
  return null
}

export const deleteDebtNote = async (portfolioId: string, debtId: string, noteId: string) => {
  if (isDemoPortfolio(portfolioId)) return mockDeleteNote(noteId)
  await api(`${debtPath(portfolioId, debtId)}/notes/${noteId}`, { method: 'DELETE' })
  return null
}

export const listDebtDocuments = async (portfolioId: string, debtId: string): Promise<DebtDocument[]> => {
  if (!isDemoPortfolio(portfolioId)) {
    const list = (await api<Array<ApiDocument & { debt_id: string }> | null>(`${debtPath(portfolioId, debtId)}/documents`)) ?? []
    return list.map(toDocument).sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))
  }
  return later(newest(documents.filter((d) => d.debt_id === debtId).map((d) => ({ ...d, created_at: d.uploaded_at }))))
}

export const uploadDebtDocument = async (portfolioId: string, debtId: string, file: File) => {
  if (isDemoPortfolio(portfolioId)) return mockUpload(debtId, file)
  const form = new FormData()
  form.append('file', file)
  return toDocument(
    await api<ApiDocument & { debt_id: string }>(`${debtPath(portfolioId, debtId)}/documents`, { method: 'POST', body: form }),
  )
}

/** A link to open the file: a short-lived signed URL from the API, or the mock's local copy (a placeholder for seeded ones). */
export const getDebtDocumentUrl = async (portfolioId: string, debtId: string, doc: Pick<DebtDocument, 'id' | 'file_name'>) => {
  if (!isDemoPortfolio(portfolioId)) {
    return (await api<{ url: string }>(`${debtPath(portfolioId, debtId)}/documents/${doc.id}/download-url`)).url
  }
  return URL.createObjectURL(files.get(doc.id) ?? new Blob([`${doc.file_name} (sample document)`], { type: 'text/plain' }))
}

export const deleteDebtDocument = async (portfolioId: string, debtId: string, docId: string) => {
  if (isDemoPortfolio(portfolioId)) return mockDeleteDocument(docId)
  await api(`${debtPath(portfolioId, debtId)}/documents/${docId}`, { method: 'DELETE' })
  return null
}
