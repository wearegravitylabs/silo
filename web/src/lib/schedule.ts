// Recurring schedules shared by debts (repayments, Auto-Pilot) and assets (Auto-Pilot).

export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'biannual' | 'annually'

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  biannual: 'Every 6 Months',
  annually: 'Annually',
}

/** `from` moved forward by n periods. */
export function addPeriods(from: Date, frequency: Frequency, n: number) {
  const d = new Date(from)
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + n)
      break
    case 'weekly':
      d.setDate(d.getDate() + 7 * n)
      break
    case 'biweekly':
      d.setDate(d.getDate() + 14 * n)
      break
    case 'monthly':
      d.setMonth(d.getMonth() + n)
      break
    case 'quarterly':
      d.setMonth(d.getMonth() + 3 * n)
      break
    case 'biannual':
      d.setMonth(d.getMonth() + 6 * n)
      break
    case 'annually':
      d.setFullYear(d.getFullYear() + n)
      break
  }
  return d
}

/** The next day (YYYY-MM-DD) a schedule runs: its start, or the first run from today on; null once it has ended. */
export function nextRun({ start_date, end_date, frequency }: { start_date: string; end_date: string | null; frequency: Frequency }) {
  const [y, m, d] = start_date.split('-').map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let run = new Date(y, m - 1, d)
  for (let n = 1; run < today; n++) run = addPeriods(new Date(y, m - 1, d), frequency, n)
  const iso = `${run.getFullYear()}-${String(run.getMonth() + 1).padStart(2, '0')}-${String(run.getDate()).padStart(2, '0')}`
  return end_date && iso > end_date ? null : iso
}
