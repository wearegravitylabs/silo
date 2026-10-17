import { premiumPrice, type BillingCycle } from './data'
import { invoiceStatus, nextPeriod, shiftDay, today } from './lib'
import type { BillingScenario, Invoice, Subscription } from './types'

// TODO: mocked until billing exists. Expected endpoints: GET /billing/subscription, GET /billing/invoices,
// POST /billing/trial/end, POST /billing/subscription (upgrade or change cycle), POST /billing/invoices/:id/pay,
// GET /billing/invoices/:id/pdf. Dates are relative to today so every state stays current.

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))
const CARD = 'MASTERCARD 1025'
const TRIAL_DAYS = 7

let subscription: Subscription
let invoices: Invoice[]

function invoice(n: number, due: string, amount: number, currency: string, paid: boolean): Invoice {
  return {
    id: `inv-${n}`,
    number: `01FGMZ-${String(n).padStart(3, '0')}`,
    plan_name: 'Premium Plan',
    amount,
    currency,
    due_date: due,
    paid_at: paid ? due : null,
    payment_method: paid ? CARD : null,
  }
}

/** Monthly Premium history ending at `renewal`: paid months before it, `renewal` itself unpaid. */
function premiumHistory(renewal: string, months: number, paidUpTo: string) {
  const price = premiumPrice('NGN', 'monthly')
  return Array.from({ length: months }, (_, i) => {
    const due = shiftDay(renewal, { months: -i })
    return invoice(months - i, due, price, 'NGN', due < paidUpTo)
  })
}

/** Start the mock over in one of the designed states. */
export function resetBilling(scenario: BillingScenario) {
  const now = today()
  const premium = (status: Subscription['status'], periodEnd: string): Subscription => ({
    plan: 'premium',
    status,
    cycle: 'monthly',
    currency: 'NGN',
    amount: premiumPrice('NGN', 'monthly'),
    trial_days: TRIAL_DAYS,
    period_end: periodEnd,
  })
  const trial = (status: Subscription['status'], periodEnd: string): Subscription => ({
    plan: 'trial',
    status,
    cycle: 'monthly',
    currency: 'NGN',
    amount: 0,
    trial_days: TRIAL_DAYS,
    period_end: periodEnd,
  })

  switch (scenario) {
    case 'trial':
      subscription = trial('active', shiftDay(now, { days: 4 }))
      invoices = []
      break
    case 'trial-ended':
      subscription = trial('inactive', shiftDay(now, { days: -2 }))
      invoices = []
      break
    case 'premium': {
      const renewal = shiftDay(now, { days: 11 })
      subscription = premium('active', renewal)
      invoices = premiumHistory(renewal, 3, renewal)
      break
    }
    case 'renews-today':
      subscription = premium('active', now)
      invoices = premiumHistory(now, 3, now)
      break
    case 'overdue': {
      // Last renewal went unpaid; the next one is already listed.
      const lapsed = shiftDay(now, { days: -12 })
      subscription = premium('overdue', lapsed)
      invoices = premiumHistory(shiftDay(lapsed, { months: 1 }), 4, lapsed)
      break
    }
  }
}
resetBilling('trial')

export const getSubscription = async (): Promise<Subscription> => {
  await delay(200)
  return { ...subscription }
}

/** Newest first. */
export const listInvoices = async (): Promise<Invoice[]> => {
  await delay(300)
  return [...invoices].sort((a, b) => b.due_date.localeCompare(a.due_date)).map((i) => ({ ...i }))
}

/** Stop the free trial now; the account is inactive until it upgrades. */
export const endTrial = async () => {
  await delay()
  Object.assign(subscription, { status: 'inactive', period_end: today() })
}

/** Start Premium (or switch an existing plan's cycle/currency): pays the first period now, lists the next. */
export const subscribe = async ({ cycle, currency }: { cycle: BillingCycle; currency: string }) => {
  await delay(1200)
  const now = today()
  const amount = premiumPrice(currency, cycle)
  const renewal = nextPeriod(now, cycle)
  const n = invoices.length
  invoices.push(invoice(n + 1, now, amount, currency, true), invoice(n + 2, renewal, amount, currency, false))
  Object.assign(subscription, { plan: 'premium', status: 'active', cycle, currency, amount, period_end: renewal })
}

/** Pay one invoice; paying everything that's due brings an overdue plan back to active. */
export const payInvoice = async (id: string) => {
  await delay(1000)
  const now = today()
  const target = invoices.find((i) => i.id === id)
  if (!target) throw new Error('This invoice no longer exists')
  Object.assign(target, { paid_at: now, payment_method: CARD })
  if (subscription.status === 'overdue' && !invoices.some((i) => invoiceStatus(i, now) === 'overdue')) {
    Object.assign(subscription, { status: 'active', period_end: nextPeriod(target.due_date, subscription.cycle) })
  }
}

/** The invoice as a one-page PDF. */
export const getInvoicePdf = async (id: string): Promise<Blob> => {
  await delay(400)
  const inv = invoices.find((i) => i.id === id)
  if (!inv) throw new Error('This invoice no longer exists')
  return simplePdf([
    `Silo invoice ${inv.number}`,
    inv.plan_name,
    `Amount: ${inv.amount.toLocaleString('en-US')} ${inv.currency}`,
    `Due: ${inv.due_date}`,
    `Paid: ${inv.paid_at ?? 'not yet'}${inv.payment_method ? ` (${inv.payment_method})` : ''}`,
  ])
}

/** Minimal valid PDF with a few lines of Helvetica — a stand-in until the backend renders invoices. */
function simplePdf(lines: string[]) {
  const esc = (t: string) => t.replace(/[\\()]/g, (c) => `\\${c}`)
  const text = lines.map((l, i) => `BT /F1 ${i ? 12 : 18} Tf 56 ${780 - i * 28} Td (${esc(l)}) Tj ET`).join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let body = '%PDF-1.4\n'
  const offsets = objects.map((obj, i) => {
    const at = body.length
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`
    return at
  })
  const xref = body.length
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  body += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([body], { type: 'application/pdf' })
}
