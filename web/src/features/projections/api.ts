import { demoScenarioB, defaultScenario, MOCK_BASELINE } from './mock-data'
import type { ProjectionState } from './types'

// TODO: no projection endpoints exist yet (scenarios, rules, baseline balances).
// Mock: every portfolio starts with the default Scenario A (the demo also has Scenario B); changes live in memory.
const DELAY = 400
const later = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY))

const store = new Map<string, ProjectionState>()
const stateOf = (portfolioId: string, currency: string) => {
  if (!store.has(portfolioId)) {
    const seeds = portfolioId === 'demo' ? [defaultScenario(portfolioId), demoScenarioB(portfolioId)] : [defaultScenario(portfolioId)]
    store.set(portfolioId, {
      currency,
      baseline: MOCK_BASELINE,
      scenarios: seeds.map((s) => s.scenario),
      rules: seeds.flatMap((s) => s.rules),
      intro_seen: false,
    })
  }
  return store.get(portfolioId)!
}
const update = (portfolioId: string, change: (s: ProjectionState) => ProjectionState) => {
  const next = change(store.get(portfolioId)!)
  store.set(portfolioId, next)
  return later(next)
}

export const getProjections = (portfolioId: string, currency: string) => later(structuredClone(stateOf(portfolioId, currency)))

/** Toggle rules on or off (one, or every rule of a scenario). */
export const setRulesEnabled = (portfolioId: string, ids: string[], enabled: boolean) =>
  update(portfolioId, (s) => ({ ...s, rules: s.rules.map((r) => (ids.includes(r.id) ? { ...r, enabled } : r)) }))

export const deleteRule = (portfolioId: string, id: string) =>
  update(portfolioId, (s) => ({ ...s, rules: s.rules.filter((r) => r.id !== id) }))

/** Removes the scenario and its rules. */
export const deleteScenario = (portfolioId: string, id: string) =>
  update(portfolioId, (s) => ({
    ...s,
    scenarios: s.scenarios.filter((x) => x.id !== id),
    rules: s.rules.filter((r) => r.scenario_id !== id),
  }))

export const markIntroSeen = (portfolioId: string) => update(portfolioId, (s) => ({ ...s, intro_seen: true }))
