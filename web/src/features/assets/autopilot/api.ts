import { api } from '@/lib/api-client'
import type { AutopilotRule, CreateRuleInput } from './types'

const base = (portfolioId: string) => `/portfolios/${portfolioId}/autopilot/rules`

export const listRules = (portfolioId: string) => api<AutopilotRule[] | null>(base(portfolioId)).then((d) => d ?? [])

export const createRule = (portfolioId: string, data: CreateRuleInput) =>
  api<AutopilotRule>(base(portfolioId), { method: 'POST', body: data })

export const pauseRule = (portfolioId: string, ruleId: string) => api<null>(`${base(portfolioId)}/${ruleId}/pause`, { method: 'POST' })

export const resumeRule = (portfolioId: string, ruleId: string) => api<null>(`${base(portfolioId)}/${ruleId}/resume`, { method: 'POST' })

export const deleteRule = (portfolioId: string, ruleId: string) => api<null>(`${base(portfolioId)}/${ruleId}`, { method: 'DELETE' })
