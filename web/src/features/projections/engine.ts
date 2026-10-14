import type { Balances, ProjectionMetric, ProjectionPoint, ProjectionRule } from './types'

/**
 * Month-by-month projection from today's balances under a scenario's enabled rules.
 * Growth rules compound on their category (a yearly rate, applied monthly); assets also rise with inflation,
 * so the figures are in future (nominal) money. Debts follow their own rule only.
 * TODO: "Net Worth + Cash" — the backend will define cash; until then both metrics give the same series.
 */
export function project(baseline: Balances, rules: ProjectionRule[], months: number, _metric: ProjectionMetric = 'net_worth') {
  const on = rules.filter((r) => r.enabled)
  const monthly = (yearlyPct: number) => Math.pow(1 + yearlyPct / 100, 1 / 12)
  const inflation = monthly(on.find((r) => r.kind === 'inflation')?.rate_pct ?? 0)
  const growth = (target: keyof Balances) => monthly(on.find((r) => r.kind === 'growth' && r.target === target)?.rate_pct ?? 0)
  const rate = {
    investable_assets: growth('investable_assets') * inflation,
    stocks: growth('stocks') * inflation,
    non_investable_assets: growth('non_investable_assets') * inflation,
    debts: growth('debts'),
  }

  const now = new Date()
  const points: ProjectionPoint[] = []
  for (let m = 0; m <= months; m++) {
    const at = (k: keyof Balances) => baseline[k] * Math.pow(rate[k], m)
    const assets = at('investable_assets') + at('stocks') + at('non_investable_assets')
    const debts = at('debts')
    const date = new Date(now.getFullYear(), now.getMonth() + m, 1)
    points.push({ date: date.toISOString().slice(0, 10), value: assets - debts, assets, debts })
  }
  return points
}

/** Months from now to the end of `year`'s current month ("To Oct 2036"). */
export const monthsUntil = (year: number) => (year - new Date().getFullYear()) * 12
