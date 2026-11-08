import { api, ApiError } from '@/lib/api-client'
import { isDemoPortfolio } from '@/lib/demo'
import { mockDelay } from '@/lib/mock'
import { defaultScenario, demoScenarioB, MOCK_BASELINE } from './mock-data'
import { slotsOf, type RuleTemplateId, type SlotEditor } from './templates'
import type { ProjectionRule, ProjectionState, Scenario } from './types'

// A real portfolio's scenarios and rules are the API's; the projection itself is still worked out here (engine.ts),
// since the API's /chart doesn't convert currencies or grow categories. The demo portfolios stay in memory.
// TODO: the API has no scenario colour (kept in `description`, see toScenario) or "intro seen" (kept in localStorage).
const later = mockDelay(400)

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

type Edits = typeof edits
type EditVars<K extends keyof Edits> = Parameters<Edits[K]>[1]

/** Applies one edit to the stored state. */
function applyEdit<V>(portfolioId: string, edit: (s: ProjectionState, vars: V) => ProjectionState, vars: V) {
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

// ─── API ──────────────────────────────────────────────────────────────────────

interface ApiRule {
  id: string
  scenario_id: string
  rule_type: string
  is_active: boolean
  config: Record<string, unknown> | null
}

interface ApiScenario {
  id: string
  portfolio_id: string
  name: string
  description: string
  rules?: ApiRule[] | null
}

const scenariosPath = (portfolioId: string) => `/portfolios/${portfolioId}/projections`
const rulesPath = (portfolioId: string, scenarioId: string) => `${scenariosPath(portfolioId)}/${scenarioId}/rules`

/**
 * Each template as the API keeps it: its rule type, the config key of any slot named differently, and config the API
 * reads that the template doesn't ask for. `value_change` is ours: the API's maths ignores it.
 */
const API_RULES: Record<
  RuleTemplateId,
  { type: string; keys?: Record<string, string>; extra?: (values: Record<string, string>) => Record<string, unknown> }
> = {
  value_change: { type: 'value_change', keys: { rate: 'percentage' } },
  portfolio_growth: { type: 'portfolio_growth', keys: { rate: 'percentage' }, extra: () => ({ frequency: 'annually' }) },
  asset_type_growth: { type: 'asset_type_growth', keys: { rate: 'percentage' } },
  asset_growth: { type: 'asset_growth', keys: { asset: 'asset_id', rate: 'percentage' } },
  target_value: { type: 'asset_target_value', keys: { asset: 'asset_id', target: 'target_value', year: 'by_year' } },
  interest_accrual: { type: 'debt_interest', keys: { rate: 'percentage', debt: 'debt_id' } },
  regular_payment: { type: 'debt_payment', keys: { date: 'start_date' } },
  accelerated_payoff: { type: 'debt_accelerated', keys: { rate: 'percentage' } },
  debt_free_goal: { type: 'debt_free_goal', extra: (v) => ({ months: Number(v.count) * (v.unit === 'years' ? 12 : 1) }) },
  employment_income: { type: 'employment_income', keys: { raise: 'annual_increase_pct' } },
  asset_income: { type: 'asset_income', keys: { asset: 'asset_id' } },
  one_time_income: { type: 'one_time_income' },
  future_income: { type: 'future_income', keys: { date: 'start_date' } },
  regular_expense: { type: 'regular_expense' },
  asset_cost: { type: 'asset_expense', keys: { asset: 'asset_id' } },
  management_fee: { type: 'management_fee', keys: { rate: 'percentage' } },
  planned_purchase: { type: 'planned_purchase' },
  future_obligation: { type: 'future_obligation', keys: { date: 'start_date' } },
  inflation: { type: 'inflation_rate', keys: { rate: 'percentage' } },
}
const TEMPLATE_OF = Object.fromEntries(Object.entries(API_RULES).map(([id, { type }]) => [type, id as RuleTemplateId]))

// Number slots are kept as numbers (the API's maths reads them so); the API says "annually" for our "yearly".
const NUMERIC: SlotEditor[] = ['percent', 'money', 'number', 'year']

function toConfig(template: RuleTemplateId, values: Record<string, string>) {
  const { keys = {}, extra } = API_RULES[template]
  const config: Record<string, unknown> = {}
  for (const slot of slotsOf(template)) {
    const value = values[slot.key]
    if (value === undefined || value === '') continue
    config[keys[slot.key] ?? slot.key] = NUMERIC.includes(slot.editor)
      ? Number(value)
      : slot.source === 'frequency' && value === 'yearly'
        ? 'annually'
        : value
  }
  return { ...config, ...extra?.(values) }
}

/** A rule as the UI sees it; null for a rule type it has no template for (e.g. one made from an Auto-Pilot rule). */
function toRule(r: ApiRule): ProjectionRule | null {
  const template = TEMPLATE_OF[r.rule_type]
  if (!template) return null
  const { keys = {} } = API_RULES[template]
  const values: Record<string, string> = {}
  for (const slot of slotsOf(template)) {
    const value = r.config?.[keys[slot.key] ?? slot.key]
    if (value === undefined || value === null) continue
    values[slot.key] = slot.source === 'frequency' && value === 'annually' ? 'yearly' : String(value)
  }
  return { id: r.id, scenario_id: r.scenario_id, template, values, enabled: r.is_active }
}

// Prefixed, so it's easy to move once scenarios get a colour field.
const COLOR_PREFIX = 'color:'
const SCENARIO_COLORS = ['var(--color-primary-dark)', 'var(--color-highlight)']
const colorDescription = (color: string) => `${COLOR_PREFIX}${color}`

const toScenario = (s: ApiScenario, index: number): Scenario => ({
  id: s.id,
  portfolio_id: s.portfolio_id,
  name: s.name,
  color: s.description.startsWith(COLOR_PREFIX)
    ? s.description.slice(COLOR_PREFIX.length)
    : SCENARIO_COLORS[index % SCENARIO_COLORS.length],
})

/**
 * A rule write. TODO: backend fix. The API saves the rule, then re-runs the projection and answers 404
 * PORTFOLIO_NOT_FOUND (its re-run looks the portfolio up with no caller); the reload after each edit shows what's saved.
 */
const ruleWrite = (call: Promise<unknown>) =>
  call.then(
    () => undefined,
    (error) => {
      if (!(error instanceof ApiError && error.code === 'PORTFOLIO_NOT_FOUND')) throw error
    },
  )

const postRule = (portfolioId: string, scenarioId: string, template: RuleTemplateId, values: Record<string, string>) =>
  ruleWrite(
    api(rulesPath(portfolioId, scenarioId), {
      method: 'POST',
      body: { rule_type: API_RULES[template].type, config: toConfig(template, values) },
    }),
  )

/** The scenario and template of each rule last loaded: the rule routes need the scenario, and a config its template. */
const loaded = new Map<string, Pick<ProjectionRule, 'scenario_id' | 'template'>>()
const ruleOf = (ruleId: string) => {
  const rule = loaded.get(ruleId)
  if (!rule) throw new Error('This rule no longer exists')
  return rule
}
const rulePath = (portfolioId: string, ruleId: string) => `${rulesPath(portfolioId, ruleOf(ruleId).scenario_id)}/${ruleId}`

const fetchScenarios = async (portfolioId: string) => (await api<ApiScenario[] | null>(scenariosPath(portfolioId))) ?? []

/** Gives a portfolio without scenarios the default Scenario A (there's no Create Scenario yet). One at a time. */
const seeding = new Map<string, Promise<void>>()
function seedDefault(portfolioId: string) {
  if (!seeding.has(portfolioId)) {
    const run = async () => {
      const { scenario, rules } = defaultScenario(portfolioId)
      const created = await api<ApiScenario>(scenariosPath(portfolioId), {
        method: 'POST',
        body: { name: scenario.name, description: colorDescription(scenario.color) },
      })
      for (const r of rules) await postRule(portfolioId, created.id, r.template, r.values)
    }
    seeding.set(
      portfolioId,
      run().finally(() => seeding.delete(portfolioId)),
    )
  }
  return seeding.get(portfolioId)!
}

const INTRO_SEEN_KEY = 'silo:projections-intro-seen'
const introSeen = () => {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

export async function getProjections(portfolioId: string, currency: string): Promise<ProjectionState> {
  if (isDemoPortfolio(portfolioId)) return later(structuredClone(stateOf(portfolioId, currency)))
  let list = await fetchScenarios(portfolioId)
  if (!list.length) {
    await seedDefault(portfolioId)
    list = await fetchScenarios(portfolioId)
  }
  const rules = list.flatMap((s) => s.rules ?? []).flatMap((r) => toRule(r) ?? [])
  loaded.clear()
  for (const r of rules) loaded.set(r.id, r)
  return {
    currency,
    baseline: null,
    scenarios: list.map(toScenario),
    rules,
    intro_seen: introSeen(),
  }
}

/**
 * Saves each edit: the demo's in memory (answering the new state), a real portfolio's through the API (answering
 * nothing; the caller reloads).
 */
export const saves: { [K in keyof Edits]: (portfolioId: string, vars: EditVars<K>) => Promise<ProjectionState | void> } = {
  toggle: async (portfolioId, vars) => {
    if (isDemoPortfolio(portfolioId)) return applyEdit(portfolioId, edits.toggle, vars)
    await Promise.all(
      vars.ids.map((id) => ruleWrite(api(rulePath(portfolioId, id), { method: 'PATCH', body: { is_active: vars.enabled } }))),
    )
  },
  addRule: async (portfolioId, rule) => {
    if (isDemoPortfolio(portfolioId)) return applyEdit(portfolioId, edits.addRule, rule)
    await postRule(portfolioId, rule.scenario_id, rule.template, rule.values)
  },
  updateRule: async (portfolioId, vars) => {
    if (isDemoPortfolio(portfolioId)) return applyEdit(portfolioId, edits.updateRule, vars)
    const config = toConfig(ruleOf(vars.id).template, vars.values)
    await ruleWrite(api(rulePath(portfolioId, vars.id), { method: 'PATCH', body: { config } }))
  },
  removeRule: async (portfolioId, id) => {
    if (isDemoPortfolio(portfolioId)) return applyEdit(portfolioId, edits.removeRule, id)
    await ruleWrite(api(rulePath(portfolioId, id), { method: 'DELETE' }))
  },
  updateScenario: async (portfolioId, vars) => {
    if (isDemoPortfolio(portfolioId)) return applyEdit(portfolioId, edits.updateScenario, vars)
    await api(`${scenariosPath(portfolioId)}/${vars.id}`, {
      method: 'PATCH',
      body: { name: vars.name, description: colorDescription(vars.color) },
    })
  },
  removeScenario: async (portfolioId, id) => {
    if (isDemoPortfolio(portfolioId)) return applyEdit(portfolioId, edits.removeScenario, id)
    await api(`${scenariosPath(portfolioId)}/${id}`, { method: 'DELETE' })
  },
  seenIntro: async (portfolioId, vars) => {
    if (isDemoPortfolio(portfolioId)) return applyEdit(portfolioId, edits.seenIntro, vars)
    try {
      localStorage.setItem(INTRO_SEEN_KEY, '1')
    } catch {
      // Private window or blocked storage: the intro shows again next time.
    }
  },
}
