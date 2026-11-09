// Shared by the assets and debts features (which can't import each other): Auto-Pilot rules, notes and documents
// work the same way on an asset and on a debt.
// TODO: the API can't edit a rule (callers remake it) or list one target's rules (filtered here), and keeps note tags
// as an object ({ list: [...] }).
import { api } from './api-client'
import type { Frequency } from './schedule'

export interface ApiRule {
  id: string
  target_id: string
  target_type: 'asset' | 'debt'
  action: 'add' | 'remove'
  amount: number
  units?: number | null
  frequency: Frequency
  start_date: string
  end_date?: string | null
  is_active: boolean
  created_at: string
}

const rulesPath = (portfolioId: string) => `/portfolios/${portfolioId}/autopilot/rules`
/** A YYYY-MM-DD day as the API's RFC 3339 time. */
const rfc3339 = (day: string | null) => (day ? `${day}T00:00:00Z` : null)

/** One asset's or debt's rules. */
export const listRules = async (portfolioId: string, targetType: ApiRule['target_type'], targetId: string) =>
  ((await api<ApiRule[] | null>(rulesPath(portfolioId))) ?? []).filter((r) => r.target_type === targetType && r.target_id === targetId)

export const getRule = (portfolioId: string, ruleId: string) => api<ApiRule>(`${rulesPath(portfolioId)}/${ruleId}`)

/** Adds a rule (exactly one of `amount` and `units`); days are YYYY-MM-DD. */
export const createRule = (
  portfolioId: string,
  rule: Pick<ApiRule, 'target_id' | 'target_type' | 'action' | 'frequency'> & {
    amount?: number
    units?: number
    start_date: string
    end_date: string | null
  },
) =>
  api(rulesPath(portfolioId), {
    method: 'POST',
    body: { ...rule, start_date: rfc3339(rule.start_date), end_date: rfc3339(rule.end_date) },
  })

/** Pauses an active rule, resumes a paused one. */
export const toggleRule = async (portfolioId: string, ruleId: string) => {
  const rule = await getRule(portfolioId, ruleId)
  await api(`${rulesPath(portfolioId)}/${ruleId}/${rule.is_active ? 'pause' : 'resume'}`, { method: 'POST' })
}

export const deleteRule = (portfolioId: string, ruleId: string) => api(`${rulesPath(portfolioId)}/${ruleId}`, { method: 'DELETE' })

/** The YYYY-MM-DD days of a rule as the UI keeps them. */
export const ruleDays = (r: ApiRule) => ({ start_date: r.start_date.slice(0, 10), end_date: r.end_date ? r.end_date.slice(0, 10) : null })

export interface ApiNote {
  id: string
  title: string
  content: string
  tags?: { list?: string[] } | null
  created_at: string
}

export const noteTags = (n: ApiNote) => (Array.isArray(n.tags?.list) ? n.tags.list : [])

/** A note as the API takes it. */
export const noteBody = ({ title, content, tags }: { title: string; content: string; tags: string[] }) => ({
  title,
  content,
  tags: { list: tags },
})

export interface ApiDocument {
  id: string
  file_name: string
  file_size: number
  uploaded_at: string
}
