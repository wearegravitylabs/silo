import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { defaultFolderId } from '@/lib/folders'
import type { ChartPeriod } from '@/lib/periods'
import {
  addDebtRepayment,
  adjustDebtBalance,
  createDebt,
  deleteDebt,
  deleteDebtDocument,
  deleteDebtNote,
  deleteDebtRule,
  getDebtChart,
  getDebtsOverview,
  listDebtDocuments,
  listDebtHistory,
  listDebtNotes,
  listDebtRules,
  listDebts,
  refileDebtFolder,
  saveDebtNote,
  saveDebtRule,
  toggleDebtRule,
  uploadDebtDocument,
} from './api'
import type { CreateDebtInput, DebtNoteInput, DebtRule, DebtRuleInput } from './types'

export const debtKeys = {
  all: (portfolioId: string) => ['debts', portfolioId] as const,
  /** folderId null = every debt in the portfolio */
  list: (portfolioId: string, folderId: string | null) => ['debts', portfolioId, 'list', folderId ?? 'all'] as const,
  overview: (portfolioId: string) => ['debts', portfolioId, 'overview'] as const,
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

/** Adds a debt; refetches every debt query for the portfolio (list, total). */
export const useCreateDebt = (portfolioId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDebtInput) => createDebt(portfolioId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all(portfolioId) }),
  })
}

/** Deletes a debt; refetches every debt query for the portfolio (list, total). */
export const useDeleteDebt = (portfolioId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (debtId: string) => deleteDebt(portfolioId, debtId),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all(portfolioId) }),
  })
}

/** How many debts each folder holds (by folder id); the demo's default folder lists them all. */
export const useDebtFolderCounts = (portfolioId: string) => {
  const { data: debts = [] } = useQuery(debtsQuery(portfolioId, null))
  const counts: Record<string, number> = { [defaultFolderId('debt')]: debts.length }
  for (const d of debts) if (d.folder_id) counts[d.folder_id] = (counts[d.folder_id] ?? 0) + 1
  return counts
}

/** A deleted folder's debts go to another folder (demo only; see refileDebtFolder). */
export const useRefileDebtFolder = (portfolioId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) => refileDebtFolder(portfolioId, from, to),
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
  useQuery({ queryKey: debtKeys.history(portfolioId, debtId), queryFn: () => listDebtHistory(portfolioId, debtId), staleTime: 60_000 })

/** Balance over a period; keeps the previous period's line while the next loads. */
export const useDebtChart = (portfolioId: string, debtId: string, period: ChartPeriod) =>
  useQuery({
    queryKey: debtKeys.chart(portfolioId, debtId, period),
    queryFn: () => getDebtChart(portfolioId, debtId, period),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

export const useDebtRules = (portfolioId: string, debtId: string) =>
  useQuery({ queryKey: debtKeys.rules(portfolioId, debtId), queryFn: () => listDebtRules(portfolioId, debtId), staleTime: 60_000 })

export const useDebtNotes = (portfolioId: string, debtId: string) =>
  useQuery({ queryKey: debtKeys.notes(portfolioId, debtId), queryFn: () => listDebtNotes(portfolioId, debtId), staleTime: 60_000 })

export const useDebtDocuments = (portfolioId: string, debtId: string) =>
  useQuery({ queryKey: debtKeys.documents(portfolioId, debtId), queryFn: () => listDebtDocuments(portfolioId, debtId), staleTime: 60_000 })

/** Repayment (lowers the balance) or adjustment (sets it). */
export const useDebtBalanceMutation = (portfolioId: string, debtId: string, mode: 'repayment' | 'adjust') => {
  const onSuccess = useInvalidateDebts(portfolioId)
  return useMutation({
    mutationFn: (input: { amount: number; date: string }) =>
      mode === 'repayment' ? addDebtRepayment(portfolioId, debtId, input) : adjustDebtBalance(portfolioId, debtId, input),
    onSuccess,
  })
}

export const useDebtRuleMutations = (portfolioId: string, debtId: string) => {
  const onSuccess = useInvalidateDebts(portfolioId)
  return {
    save: useMutation({
      mutationFn: (input: DebtRuleInput & { ruleId?: string }) => saveDebtRule(portfolioId, debtId, input),
      onSuccess,
    }),
    toggle: useMutation({ mutationFn: (rule: DebtRule) => toggleDebtRule(portfolioId, rule.id), onSuccess }),
    remove: useMutation({ mutationFn: (ruleId: string) => deleteDebtRule(portfolioId, ruleId), onSuccess }),
  }
}

export const useDebtNoteMutations = (portfolioId: string, debtId: string) => {
  const onSuccess = useInvalidateDebts(portfolioId)
  return {
    save: useMutation({ mutationFn: (input: DebtNoteInput & { noteId?: string }) => saveDebtNote(portfolioId, debtId, input), onSuccess }),
    remove: useMutation({ mutationFn: (noteId: string) => deleteDebtNote(portfolioId, debtId, noteId), onSuccess }),
  }
}

export const useDebtDocumentMutations = (portfolioId: string, debtId: string) => {
  const onSuccess = useInvalidateDebts(portfolioId)
  return {
    upload: useMutation({ mutationFn: (file: File) => uploadDebtDocument(portfolioId, debtId, file), onSuccess }),
    remove: useMutation({ mutationFn: (docId: string) => deleteDebtDocument(portfolioId, debtId, docId), onSuccess }),
  }
}
