import type { BillingCycle } from './data'

/** The account's plan: the free trial, or Premium once paid for. */
export interface Subscription {
  plan: 'trial' | 'premium'
  /** `inactive`: the trial ended. `overdue`: a Premium renewal wasn't paid. */
  status: 'active' | 'inactive' | 'overdue'
  cycle: BillingCycle
  currency: string
  /** Price per cycle; 0 on the trial */
  amount: number
  trial_days: number
  /** "YYYY-MM-DD": when the trial ends / ended, or Premium renews / lapsed */
  period_end: string
}

export interface Invoice {
  id: string
  number: string // "01FGMZ-001"
  plan_name: string // "Premium Plan"
  amount: number
  currency: string
  /** "YYYY-MM-DD" */
  due_date: string
  /** "YYYY-MM-DD"; null until paid */
  paid_at: string | null
  /** "MASTERCARD 1025"; null until paid */
  payment_method: string | null
}

/** Derived from the dates: see `invoiceStatus`. */
export type InvoiceStatus = 'paid' | 'upcoming' | 'overdue'

/** Dev: which account state the mock starts in (Settings → Billing `?mock=`). */
export type BillingScenario = 'trial' | 'trial-ended' | 'premium' | 'renews-today' | 'overdue'
