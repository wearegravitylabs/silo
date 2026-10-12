import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createDebt, getDebtsOverview, listDebtFolders, listDebts } from './api'
import type { CreateDebtInput } from './types'

export const debtKeys = {
  all: (portfolioId: string) => ['debts', portfolioId] as const,
  /** folderId null = every debt in the portfolio */
  list: (portfolioId: string, folderId: string | null) => ['debts', portfolioId, 'list', folderId ?? 'all'] as const,
  overview: (portfolioId: string) => ['debts', portfolioId, 'overview'] as const,
  folders: (portfolioId: string) => ['debts', portfolioId, 'folders'] as const,
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
