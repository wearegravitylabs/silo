import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRule, deleteRule, listRules, pauseRule, resumeRule } from './api'
import type { CreateRuleInput } from './types'

export const autopilotKeys = {
  rules: (portfolioId: string) => ['autopilot-rules', portfolioId] as const,
}

export const useRules = (portfolioId: string) =>
  useQuery({
    queryKey: autopilotKeys.rules(portfolioId),
    queryFn: () => listRules(portfolioId),
    enabled: !!portfolioId,
    staleTime: 30_000,
  })

/** Rule mutations for a portfolio. Each refetches the rule list when done. */
export const useRuleMutations = (portfolioId: string) => {
  const qc = useQueryClient()
  const refetch = () => qc.invalidateQueries({ queryKey: autopilotKeys.rules(portfolioId) })
  return {
    create: useMutation({ mutationFn: (data: CreateRuleInput) => createRule(portfolioId, data), onSuccess: refetch }),
    pause: useMutation({ mutationFn: (ruleId: string) => pauseRule(portfolioId, ruleId), onSuccess: refetch }),
    resume: useMutation({ mutationFn: (ruleId: string) => resumeRule(portfolioId, ruleId), onSuccess: refetch }),
    remove: useMutation({ mutationFn: (ruleId: string) => deleteRule(portfolioId, ruleId), onSuccess: refetch }),
  }
}
