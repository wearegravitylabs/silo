import { defaultDebtFolder, emptyOverview, MOCK_DEBTS, MOCK_OVERVIEW } from './mock-data'
import type { Debt, DebtFolder, DebtsOverview } from './types'

// TODO: replace with the real endpoints once the backend has every field the page needs:
//   GET /portfolios/:id/debts?folder_id=…  (exists; lacks change_pct_1m and needs_attention)
//   a debts overview (total + 1M change) — doesn't exist yet
//   folders: foldersQuery(portfolioId, 'debt') from the folders feature, once portfolios are real (they're mocked too)
// Mock: the demo portfolio has the design's debts; every other portfolio starts empty.
const DELAY = 600
const later = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY))

export const getDebtsOverview = (portfolioId: string, currency: string): Promise<DebtsOverview> =>
  later(portfolioId === 'demo' ? MOCK_OVERVIEW : emptyOverview(currency))

/** The mock ignores the folder: every debt sits in the default folder. */
export const listDebts = (portfolioId: string, _folderId?: string): Promise<Debt[]> => later(portfolioId === 'demo' ? MOCK_DEBTS : [])

/** Debt folder tabs. Mocked because portfolios are mocked: the real folders API doesn't know the demo portfolio. */
export const listDebtFolders = (portfolioId: string): Promise<DebtFolder[]> => later([defaultDebtFolder(portfolioId)])
