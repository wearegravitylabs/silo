import { formatCompactMoney, formatMoney } from '@/lib/format'
import type { ProjectionMetric, ProjectionRule, RuleTarget, ScenarioColor } from './types'

/** Classes per scenario colour (spelled out so Tailwind sees them). New scenarios take the next unused one. */
export const SCENARIO_COLORS: Record<ScenarioColor, { text: string; bg: string; border: string }> = {
  'primary-dark': { text: 'text-primary-dark', bg: 'bg-primary-dark', border: 'border-primary-dark' },
  highlight: { text: 'text-highlight', bg: 'bg-highlight', border: 'border-highlight' },
  'chart-2': { text: 'text-chart-2', bg: 'bg-chart-2', border: 'border-chart-2' },
  warning: { text: 'text-warning', bg: 'bg-warning', border: 'border-warning' },
  'folder-2': { text: 'text-folder-2', bg: 'bg-folder-2', border: 'border-folder-2' },
  'folder-6': { text: 'text-folder-6', bg: 'bg-folder-6', border: 'border-folder-6' },
}

export const TARGET_LABELS: Record<RuleTarget, string> = {
  investable_assets: 'Investable Assets',
  stocks: 'Stocks',
  non_investable_assets: 'Non Investable Assets',
  debts: 'Debts',
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

/** The rule as a sentence: plain text, with the editable parts flagged. */
export function ruleParts(rule: ProjectionRule): { text: string; editable?: boolean }[] {
  const rate = { text: `${rule.rate_pct}% per year`, editable: true }
  return rule.kind === 'inflation'
    ? [{ text: 'Inflation rate is ' }, rate]
    : [{ text: 'Value of ' }, { text: TARGET_LABELS[rule.target!], editable: true }, { text: ' to change by ' }, rate]
}
export const ruleText = (rule: ProjectionRule) =>
  ruleParts(rule)
    .map((p) => p.text)
    .join('')

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
