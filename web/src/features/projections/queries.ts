import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { applyEdit, edits, getProjections } from './api'
import type { ProjectionState } from './types'

export const projectionKeys = { all: (portfolioId: string) => ['projections', portfolioId] as const }

export const projectionsQuery = (portfolioId: string, currency: string) =>
  queryOptions({ queryKey: projectionKeys.all(portfolioId), queryFn: () => getProjections(portfolioId, currency), staleTime: Infinity })

/** Scenarios, rules and baseline. Suspends — preload with `projectionsQuery` in the route loader. */
export const useProjections = (portfolioId: string, currency: string) => useSuspenseQuery(projectionsQuery(portfolioId, currency)).data

/** One mutation per edit: patches the cache at once (so toggles and edits feel instant), then takes the mock's answer. */
const useEdit = <V>(portfolioId: string, edit: (s: ProjectionState, vars: V) => ProjectionState) => {
  const qc = useQueryClient()
  const key = projectionKeys.all(portfolioId)
  return useMutation({
    mutationFn: (vars: V) => applyEdit(portfolioId, edit, vars),
    onMutate: (vars) => {
      const prev = qc.getQueryData<ProjectionState>(key)
      if (prev) qc.setQueryData(key, edit(prev, vars))
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(key, ctx.prev),
    onSuccess: (state) => qc.setQueryData(key, state),
  })
}

export const useProjectionMutations = (portfolioId: string) => ({
  toggle: useEdit(portfolioId, edits.toggle),
  addRule: useEdit(portfolioId, edits.addRule),
  updateRule: useEdit(portfolioId, edits.updateRule),
  removeRule: useEdit(portfolioId, edits.removeRule),
  updateScenario: useEdit(portfolioId, edits.updateScenario),
  removeScenario: useEdit(portfolioId, edits.removeScenario),
  seenIntro: useEdit(portfolioId, (s: ProjectionState, _: void) => edits.seenIntro(s)),
})
