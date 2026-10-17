import { defaultScenario, demoScenarioB, MOCK_BASELINE } from './mock-data'
import type { RuleTemplateId } from './templates'
import type { ProjectionRule, ProjectionState, Scenario } from './types'

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

/** Every change: the same pure edit the cache applies optimistically (see queries.ts), then the new state. */
export const edits = {
  toggle: (s: ProjectionState, { ids, enabled }: { ids: string[]; enabled: boolean }): ProjectionState => ({
    ...s,
    rules: s.rules.map((r) => (ids.includes(r.id) ? { ...r, enabled } : r)),
  }),
  addRule: (s: ProjectionState, rule: ProjectionRule): ProjectionState => ({ ...s, rules: [...s.rules, rule] }),
  updateRule: (s: ProjectionState, { id, values }: { id: string; values: Record<string, string> }): ProjectionState => ({
    ...s,
    rules: s.rules.map((r) => (r.id === id ? { ...r, values } : r)),
  }),
  removeRule: (s: ProjectionState, id: string): ProjectionState => ({ ...s, rules: s.rules.filter((r) => r.id !== id) }),
  updateScenario: (s: ProjectionState, { id, ...patch }: Pick<Scenario, 'id' | 'name' | 'color'>): ProjectionState => ({
    ...s,
    scenarios: s.scenarios.map((x) => (x.id === id ? { ...x, ...patch } : x)),
  }),
  /** Removes the scenario and its rules. */
  removeScenario: (s: ProjectionState, id: string): ProjectionState => ({
    ...s,
    scenarios: s.scenarios.filter((x) => x.id !== id),
    rules: s.rules.filter((r) => r.scenario_id !== id),
  }),
  seenIntro: (s: ProjectionState): ProjectionState => ({ ...s, intro_seen: true }),
}

export const getProjections = (portfolioId: string, currency: string) => later(structuredClone(stateOf(portfolioId, currency)))

/** Applies one edit to the stored state. */
export function applyEdit<V>(portfolioId: string, edit: (s: ProjectionState, vars: V) => ProjectionState, vars: V) {
  const next = edit(store.get(portfolioId)!, vars)
  store.set(portfolioId, next)
  return later(next)
}

/** A new enabled rule for the scenario. */
export const newRule = (scenarioId: string, template: RuleTemplateId, values: Record<string, string>): ProjectionRule => ({
  id: crypto.randomUUID(),
  scenario_id: scenarioId,
  template,
  values,
  enabled: true,
})
