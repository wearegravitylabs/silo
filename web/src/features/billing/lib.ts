import type { StatusTone } from '@/components/status-badge'
import type { BillingCycle } from './data'
import type { Invoice, InvoiceStatus } from './types'

/** Today as a local "YYYY-MM-DD". */
export function today() {
  return isoDay(new Date())
}

export function isoDay(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** `day` moved by whole months and/or days ("2026-04-28" + 1 month → "2026-05-28"). */
export function shiftDay(day: string, { months = 0, days = 0 }: { months?: number; days?: number }) {
  const [y, m, d] = day.split('-').map(Number)
  return isoDay(new Date(y, m - 1 + months, d + days))
}

export const nextPeriod = (day: string, cycle: BillingCycle) => shiftDay(day, { months: cycle === 'monthly' ? 1 : 12 })

/** Paid once paid; unpaid is overdue after its due date, upcoming until then (including the due date itself). */
export function invoiceStatus(invoice: Invoice, on = today()): InvoiceStatus {
  if (invoice.paid_at) return 'paid'
  return invoice.due_date < on ? 'overdue' : 'upcoming'
}

/** Pay Invoice shows from the due date on: an upcoming invoice due later has nothing to pay yet. */
export const canPay = (invoice: Invoice, on = today()) => !invoice.paid_at && invoice.due_date <= on

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: StatusTone }> = {
  paid: { label: 'Paid', tone: 'success' },
  upcoming: { label: 'Upcoming', tone: 'neutral' },
  overdue: { label: 'Overdue', tone: 'destructive' },
}
