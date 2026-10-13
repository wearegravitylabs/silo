// Temporary debts, used by api.ts until the Debts page is wired to the backend. Mirrors the design.
import type { Debt, DebtDocument, DebtFolder, DebtHistoryEntry, DebtNote, DebtRule, DebtsOverview } from './types'

const CURRENCY = 'USD'
const CREATED = '2026-01-01T00:00:00Z'

const debt = (id: string, name: string, fields: Pick<Debt, 'debt_type' | 'balance' | 'interest_rate'> & Partial<Debt>): Debt => ({
  id,
  portfolio_id: 'demo',
  folder_id: null,
  name,
  principal: fields.balance,
  owned_balance: fields.balance,
  payment_amount: 0,
  frequency: '',
  has_schedule: false,
  currency: CURRENCY,
  ownership_pct: 100,
  start_date: null,
  payoff_date: null,
  created_at: CREATED,
  updated_at: CREATED,
  change_pct_1m: null,
  needs_attention: false,
  ...fields,
})

export const MOCK_DEBTS: Debt[] = [
  debt('d1', 'House Down Payment', {
    debt_type: 'mortgage',
    balance: 10_000,
    interest_rate: 0.5,
    frequency: 'weekly',
    has_schedule: true,
    payment_amount: 250,
    change_pct_1m: 5.5,
    needs_attention: true,
  }),
  debt('d2', 'University Loan', { debt_type: 'student_loan', balance: 5_000, interest_rate: 0 }),
  debt('d3', 'Toyota Payment', {
    debt_type: 'car_loan',
    balance: 10_000,
    interest_rate: 0,
    frequency: 'monthly',
    has_schedule: true,
    payment_amount: 500,
  }),
  debt('d4', 'Loan from Sarah', { debt_type: 'personal', balance: 500, interest_rate: 0 }),
  debt('d5', 'Mastercard Debt', { debt_type: 'credit_card', balance: 10, interest_rate: 0.5 }),
]

export const MOCK_OVERVIEW: DebtsOverview = {
  currency: CURRENCY,
  total: 10_000,
  change: { amount: 10_000, pct: 100 },
}

/** A portfolio with no debts yet. */
export const emptyOverview = (currency: string): DebtsOverview => ({ currency, total: 0, change: { amount: 0, pct: 0 } })

/** The default folder the backend creates for every portfolio. */
export const defaultDebtFolder = (portfolioId: string): DebtFolder => ({
  id: 'all-debts',
  portfolio_id: portfolioId,
  folder_type: 'debt',
  name: 'All Debts',
  icon: null,
  image_url: null,
  position: 0,
  created_at: CREATED,
  updated_at: CREATED,
})

// ─── Detail panel seeds (House Down Payment, as in the design); other debts start empty ──

export const MOCK_HISTORY: DebtHistoryEntry[] = [
  {
    id: 'h1',
    debt_id: 'd1',
    kind: 'initial',
    date: '2026-02-12',
    balance: 10_000,
    previous: null,
    created_at: '2026-02-12T09:00:00Z',
  },
]

/** A day relative to today, as YYYY-MM-DD — seeded rules stay current whenever the demo runs. */
const dayFromToday = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const MOCK_RULES: DebtRule[] = [
  {
    id: 'r1',
    debt_id: 'd1',
    action: 'payment',
    amount: 100,
    frequency: 'daily',
    start_date: dayFromToday(-14),
    end_date: dayFromToday(46),
    is_active: true,
    created_at: '2026-02-28T09:00:00Z',
  },
  {
    id: 'r2',
    debt_id: 'd1',
    action: 'add',
    amount: 100,
    frequency: 'weekly',
    start_date: dayFromToday(-14),
    end_date: dayFromToday(46),
    is_active: true,
    created_at: '2026-02-27T09:00:00Z',
  },
]

const NOTE_TEXT = 'I believe it will outperform by Q4 2026, and has a long-term return potential'

export const MOCK_NOTES: DebtNote[] = [
  {
    id: 'n1',
    debt_id: 'd1',
    title: 'Why I bought this?',
    content: NOTE_TEXT,
    tags: ['Strategy', 'Long-Term'],
    created_at: '2026-03-04T12:00:00Z',
  },
  { id: 'n2', debt_id: 'd1', title: '', content: NOTE_TEXT, tags: ['Strategy', 'Long-Term'], created_at: '2026-03-04T11:00:00Z' },
  { id: 'n3', debt_id: 'd1', title: '', content: NOTE_TEXT, tags: [], created_at: '2026-03-04T10:00:00Z' },
]

export const MOCK_DOCUMENTS: DebtDocument[] = [
  { id: 'doc1', debt_id: 'd1', file_name: 'debt-document.docx', file_size: 445 * 1024, uploaded_at: '2026-03-04T12:00:00Z' },
]
