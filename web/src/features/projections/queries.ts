import { queryOptions, useMutation, useQueries, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { edits, getProjectionChart, getProjectionMilestones, getProjections, saves } from './api'
import type { ProjectionMetric, ProjectionState } from './types'

export const projectionKeys = {
  all: (portfolioId: string) => ['projections', portfolioId] as const,
  chart: (portfolioId: string, scenarioId: string, years: number, metric: ProjectionMetric) =>
    [...projectionKeys.all(portfolioId), 'chart', scenarioId, years, metric] as const,
  milestones: (portfolioId: string, scenarioId: string, metric: ProjectionMetric) =>
    [...projectionKeys.all(portfolioId), 'milestones', scenarioId, metric] as const,
}

export const projectionsQuery = (portfolioId: string, currency: string) =>
  queryOptions({ queryKey: projectionKeys.all(portfolioId), queryFn: () => getProjections(portfolioId, currency), staleTime: Infinity })

/** Scenarios and rules. Suspends — preload with `projectionsQuery` in the route loader. */
export const useProjections = (portfolioId: string, currency: string) => useSuspenseQuery(projectionsQuery(portfolioId, currency)).data

/** Each scenario's projection to `years` ahead, valued as `metric` asks (keeps the last one while the next loads). */
export const useProjectionCharts = (portfolioId: string, scenarioIds: string[], years: number, metric: ProjectionMetric) =>
  useQueries({
    queries: scenarioIds.map((id) => ({
      queryKey: projectionKeys.chart(portfolioId, id, years, metric),
      queryFn: () => getProjectionChart(portfolioId, id, years, metric),
      placeholderData: (previous: Awaited<ReturnType<typeof getProjectionChart>> | undefined) => previous,
    })),
  })

/** The scenario at the Time Stamp milestones; fetched only while `enabled` (the Time Stamp view). */
export const useProjectionMilestones = (portfolioId: string, scenarioId: string, metric: ProjectionMetric, enabled: boolean) =>
  useQuery({
    queryKey: projectionKeys.milestones(portfolioId, scenarioId, metric),
    queryFn: () => getProjectionMilestones(portfolioId, scenarioId, metric),
    enabled,
  })

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
    onSuccess: (state) => {
      if (state) qc.setQueryData(key, state)
      // Reload the rest (the projections, and a real portfolio's saved state): the API works them out again.
      qc.invalidateQueries({ queryKey: key })
    },
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
