// Calendar days as local "YYYY-MM-DD" strings — the shape every date field, schedule and mock uses.

const pad = (n: number) => String(n).padStart(2, '0')

/** A date as a local "YYYY-MM-DD". */
export const isoDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** Today as a local "YYYY-MM-DD". */
export const today = () => isoDay(new Date())

/** A day relative to today (negative for the past), as "YYYY-MM-DD". */
export const daysFromToday = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return isoDay(d)
}

/** `day` moved by whole months and/or days ("2026-04-28" + 1 month → "2026-05-28"). */
export function shiftDay(day: string, { months = 0, days = 0 }: { months?: number; days?: number }) {
  const [y, m, d] = day.split('-').map(Number)
  return isoDay(new Date(y, m - 1 + months, d + days))
}
