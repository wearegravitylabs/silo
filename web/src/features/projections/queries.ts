import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { deleteRule, deleteScenario, getProjections, markIntroSeen, setRulesEnabled } from './api'
import type { ProjectionState } from './types'

export const projectionKeys = { all: (portfolioId: string) => ['projections', portfolioId] as const }

export const projectionsQuery = (portfolioId: string, currency: string) =>
  queryOptions({ queryKey: projectionKeys.all(portfolioId), queryFn: () => getProjections(portfolioId, currency), staleTime: Infinity })

/** Scenarios, rules and baseline. Suspends — preload with `projectionsQuery` in the route loader. */
export const useProjections = (portfolioId: string, currency: string) => useSuspenseQuery(projectionsQuery(portfolioId, currency)).data

/**
 * Every change patches the cache at once (toggles feel instant) and then takes the mock's answer.
 * `patch` mirrors what the API does to the state.
 */
const useProjectionMutation = <V>(
  portfolioId: string,
  mutationFn: (vars: V) => Promise<ProjectionState>,
  patch: (state: ProjectionState, vars: V) => ProjectionState,
) => {
  const qc = useQueryClient()
  const key = projectionKeys.all(portfolioId)
  return useMutation({
    mutationFn,
    onMutate: (vars) => {
      const prev = qc.getQueryData<ProjectionState>(key)
      if (prev) qc.setQueryData(key, patch(prev, vars))
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(key, ctx.prev),
    onSuccess: (state) => qc.setQueryData(key, state),
  })
}

export const useProjectionMutations = (portfolioId: string) => ({
  toggle: useProjectionMutation(
    portfolioId,
    ({ ids, enabled }: { ids: string[]; enabled: boolean }) => setRulesEnabled(portfolioId, ids, enabled),
    (s, { ids, enabled }) => ({ ...s, rules: s.rules.map((r) => (ids.includes(r.id) ? { ...r, enabled } : r)) }),
  ),
  removeRule: useProjectionMutation(
    portfolioId,
    (id: string) => deleteRule(portfolioId, id),
    (s, id) => ({ ...s, rules: s.rules.filter((r) => r.id !== id) }),
  ),
  removeScenario: useProjectionMutation(
    portfolioId,
    (id: string) => deleteScenario(portfolioId, id),
    (s, id) => ({ ...s, scenarios: s.scenarios.filter((x) => x.id !== id), rules: s.rules.filter((r) => r.scenario_id !== id) }),
  ),
  seenIntro: useProjectionMutation(
    portfolioId,
    (_: void) => markIntroSeen(portfolioId),
    (s) => ({ ...s, intro_seen: true }),
  ),
})
