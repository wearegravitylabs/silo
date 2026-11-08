import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { edits, getProjections, saves } from './api'
import type { ProjectionState } from './types'

export const projectionKeys = { all: (portfolioId: string) => ['projections', portfolioId] as const }

export const projectionsQuery = (portfolioId: string, currency: string) =>
  queryOptions({ queryKey: projectionKeys.all(portfolioId), queryFn: () => getProjections(portfolioId, currency), staleTime: Infinity })

/** Scenarios, rules and baseline. Suspends — preload with `projectionsQuery` in the route loader. */
export const useProjections = (portfolioId: string, currency: string) => useSuspenseQuery(projectionsQuery(portfolioId, currency)).data

/**
 * One mutation per edit: patches the cache at once (so toggles and edits feel instant), then takes the saved state:
 * the mock's answer, or a reload from the API.
 */
const useEdit = <V>(
  portfolioId: string,
  edit: (s: ProjectionState, vars: V) => ProjectionState,
  save: (portfolioId: string, vars: V) => Promise<ProjectionState | void>,
) => {
  const qc = useQueryClient()
  const key = projectionKeys.all(portfolioId)
  return useMutation({
    mutationFn: (vars: V) => save(portfolioId, vars),
    onMutate: (vars) => {
      const prev = qc.getQueryData<ProjectionState>(key)
      if (prev) qc.setQueryData(key, edit(prev, vars))
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev)
      qc.invalidateQueries({ queryKey: key }) // part of a bulk change may have saved
    },
    onSuccess: (state) => (state ? qc.setQueryData(key, state) : qc.invalidateQueries({ queryKey: key })),
  })
}

export const useProjectionMutations = (portfolioId: string) => ({
  toggle: useEdit(portfolioId, edits.toggle, saves.toggle),
  addRule: useEdit(portfolioId, edits.addRule, saves.addRule),
  updateRule: useEdit(portfolioId, edits.updateRule, saves.updateRule),
  removeRule: useEdit(portfolioId, edits.removeRule, saves.removeRule),
  updateScenario: useEdit(portfolioId, edits.updateScenario, saves.updateScenario),
  removeScenario: useEdit(portfolioId, edits.removeScenario, saves.removeScenario),
  seenIntro: useEdit(
    portfolioId,
    (s: ProjectionState, _: void) => edits.seenIntro(s),
    (pid, _: void) => saves.seenIntro(pid, undefined),
  ),
})
