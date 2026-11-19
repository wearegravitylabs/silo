import { api } from '@/lib/api-client'
import { isDemoPortfolio } from '@/lib/demo'
import { mockDelay } from '@/lib/mock'
import { project } from './engine'
import { defaultScenario, demoScenarioB, MOCK_BASELINE } from './mock-data'
import { slotsOf, type RuleTemplateId, type SlotEditor } from './templates'
import type {
  ProjectionChange,
  ProjectionChart,
  ProjectionMetric,
  ProjectionPoint,
  ProjectionRule,
  ProjectionState,
  Scenario,
} from './types'

// A real portfolio's scenarios, rules and projections are the API's: it does the maths, and the page shows its answer
// as it is. The demo portfolios stay in memory, projected by the mock engine (engine.ts).
const later = mockDelay(400)

const store = new Map<string, ProjectionState>()
const stateOf = (portfolioId: string, currency: string) => {
  if (!store.has(portfolioId)) {
    const seeds = portfolioId === 'demo' ? [defaultScenario(portfolioId), demoScenarioB(portfolioId)] : [defaultScenario(portfolioId)]
    store.set(portfolioId, {
      currency,
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
  color: string
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

/** Colours for scenarios saved without one, by position. */
const SCENARIO_COLORS = ['var(--color-primary-dark)', 'var(--color-highlight)']

const toScenario = (s: ApiScenario, index: number): Scenario => ({
  id: s.id,
  portfolio_id: s.portfolio_id,
  name: s.name,
  color: s.color || SCENARIO_COLORS[index % SCENARIO_COLORS.length],
})

const postRule = (portfolioId: string, scenarioId: string, template: RuleTemplateId, values: Record<string, string>) =>
  api(rulesPath(portfolioId, scenarioId), {
    method: 'POST',
    body: { rule_type: API_RULES[template].type, config: toConfig(template, values) },
  })

/** The scenario and template of each rule last loaded: the rule routes need the scenario, and a config its template. */
const loaded = new Map<string, Pick<ProjectionRule, 'scenario_id' | 'template'>>()
const ruleOf = (ruleId: string) => {
  const rule = loaded.get(ruleId)
  if (!rule) throw new Error('This rule no longer exists')
  return rule
}
const rulePath = (portfolioId: string, ruleId: string) => `${rulesPath(portfolioId, ruleOf(ruleId).scenario_id)}/${ruleId}`

const fetchScenarios = async (portfolioId: string) => (await api<ApiScenario[] | null>(scenariosPath(portfolioId))) ?? []

/** Whether the user has closed the projections intro: kept in their settings, so every device knows. */
const INTRO_SEEN = 'projections_intro_seen'
const introSeen = async () => (await api<{ settings?: Record<string, unknown> | null }>('/users/me')).settings?.[INTRO_SEEN] === true

export async function getProjections(portfolioId: string, currency: string): Promise<ProjectionState> {
  if (isDemoPortfolio(portfolioId)) return later(structuredClone(stateOf(portfolioId, currency)))
  // The API gives every portfolio Scenario A, and the last scenario can't be deleted, so there's always one.
  const [list, seen] = await Promise.all([fetchScenarios(portfolioId), introSeen()])
  const rules = list.flatMap((s) => s.rules ?? []).flatMap((r) => toRule(r) ?? [])
  loaded.clear()
  for (const r of rules) loaded.set(r.id, r)
  return {
    currency,
    scenarios: list.map(toScenario),
    rules,
    intro_seen: seen,
  }
}

// ─── Projections ──────────────────────────────────────────────────────────────

/** A projected month as the API gives it. */
interface ApiPoint {
  month: number
  net_worth: number
  /** Net worth plus the cash income and spending have added up to since today */
  net_worth_with_cash: number
  assets: number
  debts: number
}

/** The point `month` months from now, valued as the metric asks. */
const pointAt = (month: number, p: Omit<ApiPoint, 'month'>, metric: ProjectionMetric): ProjectionPoint => {
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth() + month, 1)
  const value = metric === 'net_worth_cash' ? p.net_worth_with_cash : p.net_worth
  return { date: date.toISOString().slice(0, 10), value, assets: p.assets, debts: p.debts }
}

/** The demo's change from today (the mock engine's points; a real projection's change is the API's). */
const mockChange = (points: ProjectionPoint[], months: number): ProjectionChange | null => {
  const start = points[0]?.value
  const end = points[months]?.value
  if (start == null || end == null) return null
  return { amount: end - start, pct: start ? ((end - start) / Math.abs(start)) * 100 : null }
}

/** The demo scenario's months 0 … `months`, from the mock engine. */
const mockProjection = (portfolioId: string, scenarioId: string, months: number) =>
  project(
    MOCK_BASELINE,
    (store.get(portfolioId)?.rules ?? []).filter((r) => r.scenario_id === scenarioId),
    months,
  )

/** A scenario's monthly projection from today to `years` ahead, valued as `metric` asks, and the API's change to its end. */
export async function getProjectionChart(
  portfolioId: string,
  scenarioId: string,
  years: number,
  metric: ProjectionMetric,
): Promise<ProjectionChart> {
  if (isDemoPortfolio(portfolioId)) {
    const points = mockProjection(portfolioId, scenarioId, years * 12)
    return later({ points, change: mockChange(points, years * 12) })
  }
  const chart = await api<{
    points: ApiPoint[] | null
    change_amount: number
    change_pct: number | null
    change_amount_with_cash: number
    change_pct_with_cash: number | null
  }>(`${scenariosPath(portfolioId)}/${scenarioId}/chart`, { method: 'POST', body: { years_ahead: years } })
  const cash = metric === 'net_worth_cash'
  return {
    points: (chart.points ?? []).map((p) => pointAt(p.month, p, metric)),
    change: cash
      ? { amount: chart.change_amount_with_cash, pct: chart.change_pct_with_cash }
      : { amount: chart.change_amount, pct: chart.change_pct },
  }
}

/** A point at a milestone, with its change from today (none for net worth + cash: the API gives it for net worth). */
export type MilestonePoint = ProjectionPoint & { change: ProjectionChange | null }

/** A scenario today and at the API's milestones (1, 6, 12, 60, 120, 240 … months), by months from now. */
export interface ProjectionMilestones {
  start: ProjectionPoint
  at: Record<number, MilestonePoint>
}

export async function getProjectionMilestones(
  portfolioId: string,
  scenarioId: string,
  metric: ProjectionMetric,
): Promise<ProjectionMilestones> {
  if (isDemoPortfolio(portfolioId)) {
    const points = mockProjection(portfolioId, scenarioId, 240)
    return later({
      start: points[0],
      at: Object.fromEntries(points.map((p, months) => [months, { ...p, change: mockChange(points, months) }])),
    })
  }
  const result = await api<{
    starting_net_worth: number
    starting_assets: number
    starting_debts: number
    milestones: Array<ApiPoint & { months: number; change_amount: number; change_pct: number }> | null
  }>(`${scenariosPath(portfolioId)}/${scenarioId}/compute`, { method: 'POST' })
  const start = { net_worth: result.starting_net_worth, net_worth_with_cash: result.starting_net_worth }
  return {
    start: pointAt(0, { ...start, assets: result.starting_assets, debts: result.starting_debts }, metric),
    at: Object.fromEntries(
      (result.milestones ?? []).map((m) => [
        m.months,
        {
          ...pointAt(m.months, m, metric),
          change: metric === 'net_worth' ? { amount: m.change_amount, pct: m.change_pct } : null,
        },
      ]),
    ),
  }
}

/**
 * Saves each edit: the demo's in memory (answering the new state), a real portfolio's through the API (answering
 * nothing; the caller reloads).
 */
export const saves: { [K in keyof Edits]: (portfolioId: string, vars: EditVars<K>) => Promise<ProjectionState | void> } = {
  toggle: async (portfolioId, vars) => {
    if (isDemoPortfolio(portfolioId)) return applyEdit(portfolioId, edits.toggle, vars)
    await Promise.all(vars.ids.map((id) => api(rulePath(portfolioId, id), { method: 'PATCH', body: { is_active: vars.enabled } })))
  },
  addRule: async (portfolioId, rule) => {
    if (isDemoPortfolio(portfolioId)) return applyEdit(portfolioId, edits.addRule, rule)
    await postRule(portfolioId, rule.scenario_id, rule.template, rule.values)
  },
  updateRule: async (portfolioId, vars) => {
    if (isDemoPortfolio(portfolioId)) return applyEdit(portfolioId, edits.updateRule, vars)
    const config = toConfig(ruleOf(vars.id).template, vars.values)
    await api(rulePath(portfolioId, vars.id), { method: 'PATCH', body: { config } })
  },
  removeRule: async (portfolioId, id) => {
    if (isDemoPortfolio(portfolioId)) return applyEdit(portfolioId, edits.removeRule, id)
    await api(rulePath(portfolioId, id), { method: 'DELETE' })
  },
  updateScenario: async (portfolioId, vars) => {
    if (isDemoPortfolio(portfolioId)) return applyEdit(portfolioId, edits.updateScenario, vars)
    await api(`${scenariosPath(portfolioId)}/${vars.id}`, {
      method: 'PATCH',
      body: { name: vars.name, color: vars.color },
    })
  },
  removeScenario: async (portfolioId, id) => {
    if (isDemoPortfolio(portfolioId)) return applyEdit(portfolioId, edits.removeScenario, id)
    await api(`${scenariosPath(portfolioId)}/${id}`, { method: 'DELETE' })
  },
  seenIntro: async (portfolioId, vars) => {
    if (isDemoPortfolio(portfolioId)) return applyEdit(portfolioId, edits.seenIntro, vars)
    await api('/users/me', { method: 'PATCH', body: { settings: { [INTRO_SEEN]: true } } })
  },
}
