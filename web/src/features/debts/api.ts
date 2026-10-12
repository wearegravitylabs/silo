import { defaultDebtFolder, emptyOverview, MOCK_DEBTS, MOCK_OVERVIEW } from './mock-data'
import type { CreateDebtInput, Debt, DebtFolder, DebtsOverview } from './types'

// TODO: replace with the real endpoints once the backend has every field the page needs:
//   GET  /portfolios/:id/debts?folder_id=…  (exists; lacks change_pct_1m, needs_attention, icon)
//   POST /portfolios/:id/debts               (exists; CreateDebtRequest)
//   a debts overview (total + 1M change) — doesn't exist yet
//   folders: foldersQuery(portfolioId, 'debt') from the folders feature, once portfolios are real (they're mocked too)
// Mock: the demo portfolio starts with the design's debts, every other portfolio empty; added debts live in memory.
const DELAY = 600
const later = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY))

const store = new Map<string, Debt[]>()
const debtsOf = (portfolioId: string) => {
  if (!store.has(portfolioId)) store.set(portfolioId, portfolioId === 'demo' ? [...MOCK_DEBTS] : [])
  return store.get(portfolioId)!
}
/** Balances added in this session, on top of the demo's fixed design total. */
const added = new Map<string, number>()

export const getDebtsOverview = (portfolioId: string, currency: string): Promise<DebtsOverview> => {
  const extra = added.get(portfolioId) ?? 0
  if (portfolioId === 'demo') return later({ ...MOCK_OVERVIEW, total: MOCK_OVERVIEW.total + extra })
  // A new portfolio's debt all arrived this month: the change is the whole total (+100%).
  return later(extra > 0 ? { currency, total: extra, change: { amount: extra, pct: 100 } } : emptyOverview(currency))
}

/** The mock ignores the folder: every debt sits in the default folder. */
export const listDebts = (portfolioId: string, _folderId?: string): Promise<Debt[]> => later([...debtsOf(portfolioId)])

/** Debt folder tabs. Mocked because portfolios are mocked: the real folders API doesn't know the demo portfolio. */
export const listDebtFolders = (portfolioId: string): Promise<DebtFolder[]> => later([defaultDebtFolder(portfolioId)])

export const createDebt = (portfolioId: string, input: CreateDebtInput): Promise<Debt> => {
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
  }
  debtsOf(portfolioId).push(debt)
  added.set(portfolioId, (added.get(portfolioId) ?? 0) + input.balance)
  return later(debt)
}
