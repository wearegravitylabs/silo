import type { RuleTemplateId } from './templates'
import type { Balances, Category, ProjectionRule, Scenario } from './types'

/** Starting balances (net worth 100,000). TODO: today's real asset and debt totals by category. */
export const MOCK_BASELINE: Balances = {
  investable_assets: 40_000,
  stocks: 35_000,
  non_investable_assets: 30_000,
  debts: 5_000,
}

type Seed = [RuleTemplateId, Record<string, string>]
const change = (target: Category, rate: number): Seed => ['value_change', { target, rate: String(rate) }]
const inflation = (rate: number): Seed => ['inflation', { rate: String(rate) }]

const seed = (portfolioId: string, suffix: string, name: string, color: string, rules: Seed[]) => {
  const id = `${portfolioId}-${suffix}`
  const scenario: Scenario = { id, portfolio_id: portfolioId, name, color }
  return {
    scenario,
    rules: rules.map(([template, values], i): ProjectionRule => ({
      id: `${id}-r${i + 1}`,
      scenario_id: id,
      template,
      values,
      enabled: true,
    })),
  }
}

/** The default scenario every portfolio starts with: the design's five rules. */
export const defaultScenario = (portfolioId: string) =>
  seed(portfolioId, 'a', 'Scenario A', 'var(--color-primary-dark)', [
    change('investable_assets', 7),
    inflation(8),
    change('stocks', 5),
    change('debts', -2),
    change('non_investable_assets', 7),
  ])

/** A gentler second scenario on the demo portfolio, so the chart compares two lines. */
export const demoScenarioB = (portfolioId: string) =>
  seed(portfolioId, 'b', 'Scenario B', 'var(--color-highlight)', [
    change('investable_assets', 5),
    inflation(3),
    change('stocks', 4),
    change('debts', -2),
    change('non_investable_assets', 3),
  ])
