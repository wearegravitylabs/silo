import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import type { ChartPeriod } from '@/lib/periods'
import {
  addDebtRepayment,
  addDebtRule,
  adjustDebtBalance,
  createDebt,
  deleteDebtDocument,
  deleteDebtNote,
  deleteDebtRule,
  getDebtChart,
  getDebtsOverview,
  listDebtDocuments,
  listDebtFolders,
  listDebtHistory,
  listDebtNotes,
  listDebtRules,
  listDebts,
  saveDebtNote,
  updateDebtRule,
  uploadDebtDocument,
} from './api'
import type { CreateDebtInput, DebtNoteInput, DebtRule, DebtRuleInput } from './types'

export const debtKeys = {
  all: (portfolioId: string) => ['debts', portfolioId] as const,
  /** folderId null = every debt in the portfolio */
  list: (portfolioId: string, folderId: string | null) => ['debts', portfolioId, 'list', folderId ?? 'all'] as const,
  overview: (portfolioId: string) => ['debts', portfolioId, 'overview'] as const,
  folders: (portfolioId: string) => ['debts', portfolioId, 'folders'] as const,
  history: (portfolioId: string, debtId: string) => ['debts', portfolioId, 'history', debtId] as const,
  chart: (portfolioId: string, debtId: string, period: ChartPeriod) => ['debts', portfolioId, 'chart', debtId, period] as const,
  rules: (portfolioId: string, debtId: string) => ['debts', portfolioId, 'rules', debtId] as const,
  notes: (portfolioId: string, debtId: string) => ['debts', portfolioId, 'notes', debtId] as const,
  documents: (portfolioId: string, debtId: string) => ['debts', portfolioId, 'documents', debtId] as const,
}

/** Debts in one folder (or the whole portfolio when folderId is null). */
export const debtsQuery = (portfolioId: string, folderId: string | null) =>
  queryOptions({
    queryKey: debtKeys.list(portfolioId, folderId),
    queryFn: () => listDebts(portfolioId, folderId ?? undefined),
    staleTime: 60_000,
  })

export const debtsOverviewQuery = (portfolioId: string, currency: string) =>
  queryOptions({
    queryKey: debtKeys.overview(portfolioId),
    queryFn: () => getDebtsOverview(portfolioId, currency),
    staleTime: 60_000,
  })

/** Folder's debts; keeps the previous folder's rows visible while switching (isPlaceholderData). */
export const useDebts = (portfolioId: string, folderId: string | null) =>
  useQuery({ ...debtsQuery(portfolioId, folderId), placeholderData: keepPreviousData })

/** Portfolio debt total. Suspends — preload with `debtsOverviewQuery` in the route loader. */
export const useDebtsOverview = (portfolioId: string, currency: string) => useSuspenseQuery(debtsOverviewQuery(portfolioId, currency)).data

export const debtFoldersQuery = (portfolioId: string) =>
  queryOptions({ queryKey: debtKeys.folders(portfolioId), queryFn: () => listDebtFolders(portfolioId), staleTime: 2 * 60_000 })

/** Debt folder tabs. Suspends — preload with `debtFoldersQuery` in the route loader. */
export const useDebtFolders = (portfolioId: string) => useSuspenseQuery(debtFoldersQuery(portfolioId)).data

/** Adds a debt; refetches every debt query for the portfolio (list, total). */
export const useCreateDebt = (portfolioId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDebtInput) => createDebt(portfolioId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all(portfolioId) }),
  })
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
// Every change refetches all of the portfolio's debt queries: a balance change moves the table and the total too.

const useInvalidateDebts = (portfolioId: string) => {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: debtKeys.all(portfolioId) })
}

export const useDebtHistory = (portfolioId: string, debtId: string) =>
  useQuery({ queryKey: debtKeys.history(portfolioId, debtId), queryFn: () => listDebtHistory(debtId), staleTime: 60_000 })

/** Balance over a period; keeps the previous period's line while the next loads. */
export const useDebtChart = (portfolioId: string, debtId: string, period: ChartPeriod) =>
  useQuery({
    queryKey: debtKeys.chart(portfolioId, debtId, period),
    queryFn: () => getDebtChart(debtId, period),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

export const useDebtRules = (portfolioId: string, debtId: string) =>
  useQuery({ queryKey: debtKeys.rules(portfolioId, debtId), queryFn: () => listDebtRules(debtId), staleTime: 60_000 })

export const useDebtNotes = (portfolioId: string, debtId: string) =>
  useQuery({ queryKey: debtKeys.notes(portfolioId, debtId), queryFn: () => listDebtNotes(debtId), staleTime: 60_000 })

export const useDebtDocuments = (portfolioId: string, debtId: string) =>
  useQuery({ queryKey: debtKeys.documents(portfolioId, debtId), queryFn: () => listDebtDocuments(debtId), staleTime: 60_000 })

/** Repayment (lowers the balance) or adjustment (sets it). */
export const useDebtBalanceMutation = (portfolioId: string, debtId: string, mode: 'repayment' | 'adjust') => {
  const onSuccess = useInvalidateDebts(portfolioId)
  return useMutation({
    mutationFn: (input: { amount: number; date: string }) =>
      mode === 'repayment' ? addDebtRepayment(debtId, input) : adjustDebtBalance(debtId, input),
    onSuccess,
  })
}

export const useDebtRuleMutations = (portfolioId: string, debtId: string) => {
  const onSuccess = useInvalidateDebts(portfolioId)
  return {
    save: useMutation({
      mutationFn: ({ ruleId, ...input }: DebtRuleInput & { ruleId?: string }) =>
        ruleId ? updateDebtRule(ruleId, input) : addDebtRule(debtId, input),
      onSuccess,
    }),
    toggle: useMutation({ mutationFn: (rule: DebtRule) => updateDebtRule(rule.id, { is_active: !rule.is_active }), onSuccess }),
    remove: useMutation({ mutationFn: deleteDebtRule, onSuccess }),
  }
}

export const useDebtNoteMutations = (portfolioId: string, debtId: string) => {
  const onSuccess = useInvalidateDebts(portfolioId)
  return {
    save: useMutation({ mutationFn: (input: DebtNoteInput & { noteId?: string }) => saveDebtNote(debtId, input), onSuccess }),
    remove: useMutation({ mutationFn: deleteDebtNote, onSuccess }),
  }
}

export const useDebtDocumentMutations = (portfolioId: string, debtId: string) => {
  const onSuccess = useInvalidateDebts(portfolioId)
  return {
    upload: useMutation({ mutationFn: (file: File) => uploadDebtDocument(debtId, file), onSuccess }),
    remove: useMutation({ mutationFn: deleteDebtDocument, onSuccess }),
  }
}
