import { formatCompactMoney, formatDay, formatMoney } from '@/lib/format'
import { RULE_TEMPLATES, type OptionSource, type Part, type Slot } from './templates'
import type { Category, ProjectionMetric, ProjectionRule } from './types'

export interface RuleOption {
  value: string
  label: string
}
/** Every option list a choice slot can pick from; `asset` and `debt` come from the portfolio. */
export type RuleOptions = Record<OptionSource, RuleOption[]>

const opts = (entries: Record<string, string>) => Object.entries(entries).map(([value, label]) => ({ value, label }))

export const CATEGORY_LABELS: Record<Category, string> = {
  investable_assets: 'Investable Assets',
  stocks: 'Stocks',
  non_investable_assets: 'Non Investable Assets',
  debts: 'Debts',
}

/** The fixed lists; the route adds the portfolio's assets and debts. */
export const STATIC_OPTIONS: Omit<RuleOptions, 'asset' | 'debt_scope' | 'fee_scope'> = {
  category: opts(CATEGORY_LABELS),
  asset_type: opts({
    investable_assets: 'Investable Assets',
    stocks: 'Stocks',
    crypto: 'Crypto',
    real_estate: 'Real Estate',
    non_investable_assets: 'Non Investable Assets',
  }),
  frequency: opts({ weekly: 'weekly', monthly: 'monthly', quarterly: 'quarterly', yearly: 'per year' }),
  duration_unit: opts({ months: 'months', years: 'years' }),
  expense_category: opts({
    housing: 'Housing',
    food: 'Food',
    transport: 'Transport',
    utilities: 'Utilities',
    healthcare: 'Healthcare',
    education: 'Education',
    entertainment: 'Entertainment',
    other: 'Other',
  }),
}

/** Full option lists from the portfolio's assets and debts. */
export function ruleOptions(assets: RuleOption[], debts: RuleOption[]): RuleOptions {
  return {
    ...STATIC_OPTIONS,
    asset: assets,
    debt_scope: [{ value: 'all', label: 'all debts' }, ...debts],
    fee_scope: [{ value: 'portfolio', label: 'portfolio' }, ...assets],
  }
}

/** A filled slot as it reads in the sentence ("7% per year", "$500", "monthly", "Mar 4, 2030"). */
export function slotText(slot: Slot, value: string, currency: string, options: Partial<RuleOptions>) {
  const text = {
    percent: `${value}%`,
    money: formatMoney(Number(value), currency, { spaced: false, decimals: Number(value) % 1 ? 2 : 0 }),
    number: value,
    year: value,
    date: formatDay(value),
    choice: options[slot.source!]?.find((o) => o.value === value)?.label ?? value,
  }[slot.kind]
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
