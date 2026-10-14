import type { Balances, Category, ProjectionMetric, ProjectionPoint, ProjectionRule } from './types'

/**
 * Month-by-month projection from today's balances under a scenario's enabled rules.
 * A category grows at its own "Value of … to change by" rate, else the portfolio-wide rate (debts only their own);
 * assets also rise with inflation, so figures are in future (nominal) money. Yearly rates are applied monthly.
 * TODO: the other rule types (income, spending, debt payments, targets…) and "Net Worth + Cash" — the backend will
 * model them; until then they don't move the projection.
 */
export function project(baseline: Balances, rules: ProjectionRule[], months: number, _metric: ProjectionMetric = 'net_worth') {
  const on = rules.filter((r) => r.enabled)
  const rateOf = (pick: (r: ProjectionRule) => boolean) => {
    const rule = on.find(pick)
    return rule ? Number(rule.values.rate) || 0 : null
  }
  const monthly = (yearlyPct: number) => Math.pow(1 + yearlyPct / 100, 1 / 12)
  const inflation = monthly(rateOf((r) => r.template === 'inflation') ?? 0)
  const portfolio = rateOf((r) => r.template === 'portfolio_growth')
  const own = (c: Category) => rateOf((r) => r.template === 'value_change' && r.values.target === c)
  const assetRate = (c: Category) => monthly(own(c) ?? portfolio ?? 0) * inflation
  const rate: Record<Category, number> = {
    investable_assets: assetRate('investable_assets'),
    stocks: assetRate('stocks'),
    non_investable_assets: assetRate('non_investable_assets'),
    debts: monthly(own('debts') ?? 0),
  }

  const now = new Date()
  const points: ProjectionPoint[] = []
  for (let m = 0; m <= months; m++) {
    const at = (c: Category) => baseline[c] * Math.pow(rate[c], m)
    const assets = at('investable_assets') + at('stocks') + at('non_investable_assets')
    const debts = at('debts')
    const date = new Date(now.getFullYear(), now.getMonth() + m, 1)
    points.push({ date: date.toISOString().slice(0, 10), value: assets - debts, assets, debts })
  }
  return points
}

/** Months from now to `year`'s current month ("To Oct 2036"). */
export const monthsUntil = (year: number) => (year - new Date().getFullYear()) * 12
