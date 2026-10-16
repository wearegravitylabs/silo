import type { Currency } from './types'

// TODO: the account segment of portfolio links comes from the backend once it has public links.
const APP_URL = 'https://app.silo.com'
const ACCOUNT_SEGMENT = '112321'

/** "Retirement Fund!" → "retirement-fund" */
export const portfolioSlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** A portfolio's public link, from its name: https://app.silo.com/112321/retirement/ */
export const portfolioUrl = (name: string) => `${APP_URL}/${ACCOUNT_SEGMENT}/${portfolioSlug(name) || 'portfolio'}/`

// Everyday names for pickers ("Naira", not "Nigerian Naira").
const SHORT_NAMES: Record<string, string> = {
  USD: 'Dollar',
  EUR: 'Euro',
  GBP: 'Pounds',
  NGN: 'Naira',
  CAD: 'Canadian Dollar',
  JPY: 'Yen',
}

/** "Naira (NGN)" */
export const currencyLabel = (c: Pick<Currency, 'code' | 'name'>) => `${SHORT_NAMES[c.code] ?? c.name} (${c.code})`
