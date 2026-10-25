import { addPeriods } from '@/lib/schedule'
import { PERIODS_PER_YEAR } from './constants'
import type { PaymentFrequency } from './types'

export type Payoff = { kind: 'date'; date: Date } | { kind: 'never' }

/**
 * When a scheduled debt is paid off, paying `payment` every period at `ratePct`% a year (amortised).
 * 'never' when each payment doesn't even cover that period's interest; null when there's nothing to work out yet.
 */
export function payoffDate({
  balance,
  payment,
  ratePct,
  frequency,
  from = new Date(),
}: {
  balance: number | null
  payment: number | null
  ratePct: number
  frequency: PaymentFrequency
  from?: Date
}): Payoff | null {
  if (!balance || balance <= 0 || !payment || payment <= 0) return null

  const r = ratePct / 100 / PERIODS_PER_YEAR[frequency]
  if (r > 0 && payment <= balance * r) return { kind: 'never' }

  const periods = Math.ceil(r > 0 ? -Math.log(1 - (r * balance) / payment) / Math.log(1 + r) : balance / payment)
  return { kind: 'date', date: addPeriods(from, frequency, periods) }
}
