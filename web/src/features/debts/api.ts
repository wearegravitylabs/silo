import { api } from '@/lib/api-client'
import { isDemoPortfolio } from '@/lib/demo'
import { defaultFolderId, fromApiFolderId } from '@/lib/folders'
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

// ─── Detail panel ─────────────────────────────────────────────────────────────
// TODO: the backend has /debts/:id/notes and /documents; history, chart and debt Auto-Pilot rules don't exist yet.

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
function entriesOf(debtId: string) {
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

/** Newest first, as the History tab lists them. */
export const listDebtHistory = (debtId: string): Promise<DebtHistoryEntry[]> => later([...entriesOf(debtId)].reverse())

/** The balance across a period: each day takes the latest entry on or before it. */
export const getDebtChart = (debtId: string, period: ChartPeriod) => {
  const entries = entriesOf(debtId)
  const end = Date.now()
  const span = periodDays(period) * 86_400_000
  const points = Array.from({ length: CHART_POINTS }, (_, i) => {
    const at = new Date(end - span + (span * i) / (CHART_POINTS - 1))
    const day = at.toISOString().slice(0, 10)
    const entry = [...entries].reverse().find((e) => e.date <= day) ?? entries[0]
    return { date: period === '1D' ? at.toISOString() : day, value: entry?.balance ?? 0 }
  })
  return later(points)
}

/** Records a balance change and moves the debt (table, header total) to the new balance. */
function recordBalance(debtId: string, kind: 'adjustment' | 'repayment', balance: number, date: string) {
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

/** A repayment lowers the balance by `amount` (not below zero). */
export const addDebtRepayment = (debtId: string, { amount, date }: { amount: number; date: string }) =>
  recordBalance(debtId, 'repayment', Math.max(0, (findDebt(debtId)?.owned_balance ?? 0) - amount), date)

/** Sets the balance to `amount`. */
export const adjustDebtBalance = (debtId: string, { amount, date }: { amount: number; date: string }) =>
  recordBalance(debtId, 'adjustment', amount, date)

export const listDebtRules = (debtId: string): Promise<DebtRule[]> => later(newest(rules.filter((r) => r.debt_id === debtId)))

export const addDebtRule = (debtId: string, input: DebtRuleInput) => {
  const rule: DebtRule = { id: crypto.randomUUID(), debt_id: debtId, action: 'payment', is_active: true, created_at: now(), ...input }
  rules.push(rule)
  return later(rule)
}

export const updateDebtRule = (ruleId: string, patch: Partial<DebtRuleInput & Pick<DebtRule, 'is_active'>>) => {
  const rule = rules.find((r) => r.id === ruleId)
  if (rule) Object.assign(rule, patch)
  return later(rule ?? null)
}

export const deleteDebtRule = (ruleId: string) => {
  const i = rules.findIndex((r) => r.id === ruleId)
  if (i !== -1) rules.splice(i, 1)
  return later(null)
}

export const listDebtNotes = (debtId: string): Promise<DebtNote[]> => later(newest(notes.filter((n) => n.debt_id === debtId)))

export const saveDebtNote = (debtId: string, { noteId, ...input }: DebtNoteInput & { noteId?: string }) => {
  const existing = noteId ? notes.find((n) => n.id === noteId) : undefined
  if (existing) Object.assign(existing, input)
  else notes.push({ id: crypto.randomUUID(), debt_id: debtId, created_at: now(), ...input })
  return later(null)
}

export const deleteDebtNote = (noteId: string) => {
  const i = notes.findIndex((n) => n.id === noteId)
  if (i !== -1) notes.splice(i, 1)
  return later(null)
}

export const listDebtDocuments = (debtId: string): Promise<DebtDocument[]> =>
  later(newest(documents.filter((d) => d.debt_id === debtId).map((d) => ({ ...d, created_at: d.uploaded_at }))))

export const uploadDebtDocument = (debtId: string, file: File) => {
  const doc: DebtDocument = { id: crypto.randomUUID(), debt_id: debtId, file_name: file.name, file_size: file.size, uploaded_at: now() }
  documents.push(doc)
  files.set(doc.id, file)
  return later(doc)
}

/** A link to the file; seeded documents have no file behind them and get a placeholder. */
export const getDebtDocumentUrl = (doc: Pick<DebtDocument, 'id' | 'file_name'>) =>
  Promise.resolve(URL.createObjectURL(files.get(doc.id) ?? new Blob([`${doc.file_name} (sample document)`], { type: 'text/plain' })))

export const deleteDebtDocument = (docId: string) => {
  const i = documents.findIndex((d) => d.id === docId)
  if (i !== -1) documents.splice(i, 1)
  files.delete(docId)
  return later(null)
}
