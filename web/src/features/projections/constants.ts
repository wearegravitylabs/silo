import type { ReactNode } from 'react'
import { formatCompactMoney, formatDay, formatMoney } from '@/lib/format'
import { RULE_TEMPLATES, type OptionSource, type Part, type Slot } from './templates'
import type { Category, ProjectionMetric, ProjectionRule } from './types'

export interface RuleOption {
  value: string
  label: string
  /** Under the label in list modals ("Stock", "Mortgage") */
  description?: string
  icon?: ReactNode
  /** How it reads in a sentence when that differs from the label ("annually", "Stock tickers") */
  text?: string
}
/** Every option list a select or list blank can pick from. */
export type RuleOptions = Record<OptionSource, RuleOption[]>

const opts = (entries: Record<string, string>) => Object.entries(entries).map(([value, label]) => ({ value, label }))

export const CATEGORY_LABELS: Record<Category, string> = {
  investable_assets: 'Investable Assets',
  stocks: 'Stocks',
  non_investable_assets: 'Non Investable Assets',
  debts: 'Debts',
}

/** Asset type ids (as in Add Asset) → [label in the picker, how it reads in a sentence]. The route adds the icons. */
export const ASSET_TYPE_PICKER: Record<string, [label: string, text: string]> = {
  stock_ticker: ['Stocks Tickers', 'Stock tickers'],
  crypto_ticker: ['Crypto Tickers', 'Crypto tickers'],
  real_estate: ['Real Estate', 'Real estate'],
  domain: ['Domains', 'Domains'],
  physical: ['Physical Valuables', 'Physical valuables'],
  venture_capital: ['Venture Capital', 'Venture capital'],
  business: ['Business', 'Business'],
  bank: ['Bank Connections', 'Bank connections'],
  crypto_wallet: ['Crypto Exchanges/Wallet', 'Crypto exchanges/wallets'],
  manual: ['Manual Assets', 'Manual assets'],
}

/** The fixed lists; asset types, assets and debts come from the portfolio (see `ruleOptions`). */
const STATIC_OPTIONS = {
  category: opts(CATEGORY_LABELS),
  frequency: [
    { value: 'daily', label: 'Daily', text: 'daily' },
    { value: 'weekly', label: 'Weekly', text: 'weekly' },
    { value: 'monthly', label: 'Monthly', text: 'monthly' },
    { value: 'yearly', label: 'Yearly', text: 'annually' },
  ],
  duration_unit: [
    { value: 'months', label: 'Months', text: 'months' },
    { value: 'years', label: 'Years', text: 'years' },
  ],
  expense_category: opts({
    housing: 'Housing',
    food: 'Food & groceries',
    transportation: 'Transportation',
    healthcare: 'Healthcare',
    insurance: 'Insurance',
    utilities: 'Utilities',
    subscriptions: 'Subscriptions',
    entertainment: 'Entertainment',
    education: 'Education',
    other: 'Other',
  }),
}

/**
 * Every option list. `assetTypes` maps an asset type id to its icon; `assets` and `debts` are the portfolio's own,
 * already shaped as options (icon + type). `allDebtsIcon` marks the "All Debts" choice.
 */
export function ruleOptions({
  assetTypeIcons = {},
  assets = [],
  debts = [],
  allDebtsIcon,
}: {
  assetTypeIcons?: Record<string, ReactNode>
  assets?: RuleOption[]
  debts?: RuleOption[]
  allDebtsIcon?: ReactNode
} = {}): RuleOptions {
  return {
    ...STATIC_OPTIONS,
    asset_type: Object.entries(ASSET_TYPE_PICKER).map(([value, [label, text]]) => ({ value, label, text, icon: assetTypeIcons[value] })),
    asset: assets,
    debt_scope: [{ value: 'all', label: 'All Debts', text: 'all debts', icon: allDebtsIcon }, ...debts],
    fee_scope: [{ value: 'portfolio', label: 'Portfolio', text: 'portfolio' }, ...assets],
  }
}

/** A filled slot as it reads in the sentence ("7% per year", "$500", "annually", "Mar 4, 2030"). */
export function slotText(slot: Slot, value: string, currency: string, options: Partial<RuleOptions>) {
  const option = slot.source && options[slot.source]?.find((o) => o.value === value)
  const text = {
    percent: `${value}%`,
    money: formatMoney(Number(value), currency, { spaced: false, decimals: Number(value) % 1 ? 2 : 0 }),
    number: value,
    year: value,
    date: formatDay(value),
    select: option ? (option.text ?? option.label) : value,
    list: option ? (option.text ?? option.label) : value,
  }[slot.editor]
  return text + (slot.suffix ?? '')
}

/** The rule as plain text, for search, sort and labels. */
export function ruleText(rule: ProjectionRule, currency: string, options: Partial<RuleOptions>) {
  return (RULE_TEMPLATES[rule.template].parts as Part[])
    .map((p) => (typeof p === 'string' ? p : rule.values[p.key] ? slotText(p, rule.values[p.key], currency, options) : p.placeholder))
    .join('')
}

/** Swatches in Edit Scenario, in order. */
export const SCENARIO_SWATCHES = [
  'var(--color-primary)',
  'var(--color-highlight)',
  'var(--color-destructive)',
  'var(--color-warning)',
  'var(--color-success)',
  'var(--color-scenario-magenta)',
  'var(--color-scenario-purple)',
]

/** A `var(--color-x)` resolved to its hex ("#bbe03b"); other colours unchanged. */
export function resolveColor(color: string) {
  const name = color.match(/^var\((--[\w-]+)\)$/)?.[1]
  return name ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() : color
}

/** Light colours need a stronger tint to read as the same faint fill (lime 5%, navy 2%). */
export function fillTint(color: string) {
  const hex = resolveColor(color).replace('#', '')
  if (!/^[\da-f]{6}$/i.test(hex)) return 4
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5 ? 5 : 2
}

export const METRIC_LABELS: Record<ProjectionMetric, string> = {
  net_worth: 'Net Worth',
  net_worth_cash: 'Net Worth + Cash',
}

/** The Time Stamp view's six horizons, in months. */
export const TIMESTAMPS = [
  { months: 1, label: '01 Month' },
  { months: 6, label: '06 Months' },
  { months: 12, label: '01 Year' },
  { months: 60, label: '05 Years' },
  { months: 120, label: '10 Years' },
  { months: 240, label: '20 Years' },
]

/** Horizon years on offer (from next year) and the default (10 years out). */
export const HORIZON_YEARS = 30
export const DEFAULT_HORIZON = 10

/** "$ 1.03M" from a million up, else "$ 456,000.00" (`decimals` below a million). */
export function projectionMoney(value: number, currency: string, decimals = 2) {
  return Math.abs(value) >= 1e6
    ? formatCompactMoney(value, currency, { decimals: 2, spaced: true })
    : formatMoney(value, currency, { decimals })
}

/** Change from today: "$ 1.20M" and "999%" (capped; one decimal at most). */
export function projectionChange(value: number, start: number, currency: string) {
  const delta = value - start
  const pct = start ? Math.min(Math.abs((delta / start) * 100), 999) : 0
  return { delta, amount: projectionMoney(Math.abs(delta), currency), pct: `${Number(pct.toFixed(1))}%` }
}
