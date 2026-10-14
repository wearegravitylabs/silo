export function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * "₦ 1,000,000.00": narrow symbol, 2 decimals by default. `spaced` puts a space after the symbol
 * (headline values) — off gives "₦10,000.00" (inline change amounts). `decimals: 0` gives "₦ 5,000".
 */
export function formatMoney(value: number, currency = 'USD', { spaced = true, decimals = 2 } = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
    .formatToParts(value)
    .map((p) => (p.type === 'currency' && spaced ? `${p.value} ` : p.value))
    .join('')
}

/** Short money for tight spaces: "₦1k", "$2.5M" (narrow symbol, one decimal at most). */
export function formatCompactMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    notation: 'compact',
    maximumFractionDigits: 1,
  })
    .format(value)
    .replace(/K$/, 'k')
}

/** Flag emoji for an ISO 4217 code; most codes start with the ISO 3166-1 country code. */
export function currencyFlag(code: string): string {
  const cc = code.slice(0, 2).toUpperCase()
  return [...cc].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('')
}

/** "Jan 5, 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** "Mar 4, 2026" for a plain YYYY-MM-DD day, read as a local day (not UTC midnight, which can show the day before). */
export function formatDay(day: string): string {
  const [y, m, d] = day.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** "JAN 5, 2026 – ongoing" */
export function formatDateRange(start: string, end?: string | null): string {
  const upper = (d: string) => formatDate(d).toUpperCase()
  return `${upper(start)} – ${end ? upper(end) : 'ongoing'}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

/** Compact size for file lists: "820B", "445KB", "1.2MB" — or "445 KB" with `spaced`. */
export function formatFileSizeShort(bytes: number, { spaced = false } = {}): string {
  const sp = spaced ? ' ' : ''
  if (bytes < 1024) return `${bytes}${sp}B`
  if (bytes < 1048576) return `${Math.round(bytes / 1024)}${sp}KB`
  return `${(bytes / 1048576).toFixed(1).replace(/\.0$/, '')}${sp}MB`
}

/** The narrow symbol for a currency: "$", "₦", "€". */
export function currencySymbol(currency: string): string {
  return (
    new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? currency
  )
}
