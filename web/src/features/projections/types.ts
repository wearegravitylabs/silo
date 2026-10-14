import type { RuleTemplateId } from './templates'

/** A what-if: its own rules, drawn in its own colour. */
export interface Scenario {
  id: string
  portfolio_id: string
  name: string
  /** Any CSS colour: a swatch's `var(--color-…)` or a custom `#RRGGBB` */
  color: string
}

/** One filled-in rule template, e.g. "All assets grow at 6% annually" → { template: 'portfolio_growth', values: { rate: '6' } }. */
export interface ProjectionRule {
  id: string
  scenario_id: string
  template: RuleTemplateId
  /** Slot key → value as text (numbers unformatted, dates ISO, choices their option value) */
  values: Record<string, string>
  enabled: boolean
}

/** What a projection category holds. */
export type Category = 'investable_assets' | 'stocks' | 'non_investable_assets' | 'debts'

/** Today's balances the projection starts from, per category. */
export type Balances = Record<Category, number>

export interface ProjectionState {
  currency: string
  baseline: Balances
  scenarios: Scenario[]
  rules: ProjectionRule[]
  intro_seen: boolean
}

export type ProjectionMetric = 'net_worth' | 'net_worth_cash'
export type ProjectionView = 'chart' | 'timestamp'

/** One month of a projection. */
export interface ProjectionPoint {
  date: string
  value: number
  assets: number
  debts: number
}
