// Mirrors api/model/debt.go. Fields marked "not in the API yet" come from the mock until the backend adds them.

export type DebtType = 'mortgage' | 'student_loan' | 'car_loan' | 'personal' | 'credit_card' | 'manual'

export type PaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'biannual' | 'annually'

export interface Debt {
  id: string
  portfolio_id: string
  folder_id: string | null
  name: string
  debt_type: DebtType
  principal: number
  balance: number
  /** balance × ownership_pct / 100 — the value the table shows. */
  owned_balance: number
  /** Annual %, 0 = interest free. */
  interest_rate: number
  payment_amount: number
  frequency: PaymentFrequency | ''
  /** Has a repayment plan (frequency + payment amount). */
  has_schedule: boolean
  currency: string
  ownership_pct: number
  start_date: string | null
  payoff_date: string | null
  created_at: string
  updated_at: string
  /** Balance change over the last month, in %. Not in the API yet. */
  change_pct_1m: number | null
  /** Flagged for the user's attention (e.g. overdue, high interest). Not in the API yet. */
  needs_attention: boolean
}

/** Portfolio-wide debt total and its change over the last month, in the base currency. Not in the API yet. */
export interface DebtsOverview {
  currency: string
  total: number
  change: { amount: number; pct: number } | null
}

/** A debt folder tab. Same shape as the folders feature's Folder, which FolderTabs takes. */
export interface DebtFolder {
  id: string
  portfolio_id: string
  folder_type: 'debt'
  name: string
  icon: string | null
  image_url: string | null
  position: number
  created_at: string
  updated_at: string
}
