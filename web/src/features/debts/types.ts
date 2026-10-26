import type { Frequency } from '@/lib/schedule'

// Mirrors api/model/debt.go. Fields marked "not in the API yet" come from the mock until the backend adds them.

export type DebtType = 'mortgage' | 'student_loan' | 'car_loan' | 'personal' | 'credit_card' | 'manual'

export type PaymentFrequency = Frequency

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
  /** Icon id chosen when adding (see DEBT_ICON_OPTIONS); null = the type's icon. Not in the API yet (could live in metadata). */
  icon?: string | null
}

/** What the Add Debt sheet sends. Mirrors api/model CreateDebtRequest, plus the icon. */
export interface CreateDebtInput {
  folder_id: string | null
  name: string
  debt_type: DebtType
  balance: number
  currency: string
  has_schedule: boolean
  payment_amount: number
  frequency: PaymentFrequency | ''
  interest_rate: number
  icon: string | null
}

/** Portfolio-wide debt total and its change over the last month, in the base currency. Not in the API yet. */
export interface DebtsOverview {
  currency: string
  total: number
  change: { amount: number; pct: number } | null
}

// ─── Detail panel (none of this is in the API yet) ───────────────────────────

/** One balance change: the starting balance, a manual adjustment, or a repayment. */
export interface DebtHistoryEntry {
  id: string
  debt_id: string
  kind: 'initial' | 'adjustment' | 'repayment'
  /** YYYY-MM-DD */
  date: string
  /** Balance after this entry */
  balance: number
  /** Balance before it; null for the initial entry */
  previous: number | null
  created_at: string
}

/** A recurring Auto-Pilot rule: pay the debt down, or add to it. */
export interface DebtRule {
  id: string
  debt_id: string
  action: 'payment' | 'add'
  amount: number
  frequency: PaymentFrequency
  /** YYYY-MM-DD */
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
}

export interface DebtRuleInput {
  amount: number
  frequency: PaymentFrequency
  start_date: string
  end_date: string | null
}

export interface DebtNote {
  id: string
  debt_id: string
  title: string
  content: string
  tags: string[]
  created_at: string
}

export interface DebtNoteInput {
  title: string
  content: string
  tags: string[]
}

export interface DebtDocument {
  id: string
  debt_id: string
  file_name: string
  file_size: number
  uploaded_at: string
}
