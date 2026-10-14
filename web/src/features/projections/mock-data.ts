import type { Balances, ProjectionRule, Scenario } from './types'

/** Starting balances (net worth 100,000). TODO: today's real asset and debt totals by category. */
export const MOCK_BASELINE: Balances = {
  investable_assets: 40_000,
  stocks: 35_000,
  non_investable_assets: 30_000,
  debts: 5_000,
}

const rules = (scenarioId: string, r: [ProjectionRule['kind'], ProjectionRule['target'], number][]): ProjectionRule[] =>
  r.map(([kind, target, rate_pct], i) => ({
    id: `${scenarioId}-r${i + 1}`,
    scenario_id: scenarioId,
    kind,
    target,
    rate_pct,
    enabled: true,
  }))

/** The default scenario every portfolio starts with: the design's five rules. */
export const defaultScenario = (portfolioId: string): { scenario: Scenario; rules: ProjectionRule[] } => {
  const id = `${portfolioId}-a`
  return {
    scenario: { id, portfolio_id: portfolioId, name: 'Scenario A', color: 'primary-dark' },
    rules: rules(id, [
      ['growth', 'investable_assets', 7],
      ['inflation', undefined, 8],
      ['growth', 'stocks', 5],
      ['growth', 'debts', -2],
      ['growth', 'non_investable_assets', 7],
    ]),
  }
}

/** A gentler second scenario on the demo portfolio, so the chart compares two lines. */
export const demoScenarioB = (portfolioId: string): { scenario: Scenario; rules: ProjectionRule[] } => {
  const id = `${portfolioId}-b`
  return {
    scenario: { id, portfolio_id: portfolioId, name: 'Scenario B', color: 'highlight' },
    rules: rules(id, [
      ['growth', 'investable_assets', 5],
      ['inflation', undefined, 3],
      ['growth', 'stocks', 4],
      ['growth', 'debts', -2],
      ['growth', 'non_investable_assets', 3],
    ]),
  }
}
