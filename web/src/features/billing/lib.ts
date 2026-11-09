import type { StatusTone } from '@/components/status-badge'
import type { BillingCycle } from './data'
import { shiftDay, today } from '@/lib/dates'
import type { Invoice, InvoiceStatus } from './types'

export { isoDay, shiftDay, today } from '@/lib/dates'

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
