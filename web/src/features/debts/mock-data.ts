// Temporary debts, used by api.ts until the Debts page is wired to the backend. Mirrors the design.
import type { Debt, DebtFolder, DebtsOverview } from './types'

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
