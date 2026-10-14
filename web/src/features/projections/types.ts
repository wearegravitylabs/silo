export type ScenarioColor = 'primary-dark' | 'highlight' | 'chart-2' | 'warning' | 'folder-2' | 'folder-6'

/** A what-if: its own rules, drawn in its own colour. */
export interface Scenario {
  id: string
  portfolio_id: string
  name: string
  color: ScenarioColor
}

/** What a growth rule moves. */
export type RuleTarget = 'investable_assets' | 'stocks' | 'non_investable_assets' | 'debts'

/** "Value of Stocks to change by 5% per year" (growth) or "Inflation rate is 8% per year" (inflation). */
export interface ProjectionRule {
  id: string
  scenario_id: string
  kind: 'growth' | 'inflation'
  /** Growth rules only */
  target?: RuleTarget
  rate_pct: number
  enabled: boolean
}

/** Today's balances the projection starts from, per category. */
export type Balances = Record<RuleTarget, number>

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
