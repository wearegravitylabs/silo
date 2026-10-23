import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { deleteAsset, getAssetsOverview, listAssets, moveAsset } from './api'

export const assetKeys = {
  all: (portfolioId: string) => ['assets', portfolioId] as const,
  /** folderId null = every asset in the portfolio */
  list: (portfolioId: string, folderId: string | null) => ['assets', portfolioId, 'list', folderId ?? 'all'] as const,
  overview: (portfolioId: string) => ['assets', portfolioId, 'overview'] as const,
}

/** Assets in one folder (or the whole portfolio when folderId is null). */
export const assetsQuery = (portfolioId: string, folderId: string | null) =>
  queryOptions({
    queryKey: assetKeys.list(portfolioId, folderId),
    queryFn: () => listAssets(portfolioId, folderId ?? undefined),
    staleTime: 60_000,
  })

export const assetsOverviewQuery = (portfolioId: string) =>
  queryOptions({ queryKey: assetKeys.overview(portfolioId), queryFn: () => getAssetsOverview(portfolioId), staleTime: 60_000 })

/** Folder's assets; keeps the previous folder's rows visible while switching (isPlaceholderData). */
export const useAssets = (portfolioId: string, folderId: string | null) =>
  useQuery({ ...assetsQuery(portfolioId, folderId), placeholderData: keepPreviousData })

/** Portfolio asset total. Suspends — preload with `assetsOverviewQuery` in the route loader. */
export const useAssetsOverview = (portfolioId: string) => useSuspenseQuery(assetsOverviewQuery(portfolioId)).data

/** Move to a folder, delete — each refetches every asset query for the portfolio (lists, total). */
export const useAssetMutations = (portfolioId: string) => {
  const qc = useQueryClient()
  const refetch = () => qc.invalidateQueries({ queryKey: assetKeys.all(portfolioId) })
  return {
    move: useMutation({
      mutationFn: ({ id, folderId }: { id: string; folderId: string }) => moveAsset(portfolioId, id, folderId),
      onSuccess: refetch,
    }),
    remove: useMutation({ mutationFn: (id: string) => deleteAsset(portfolioId, id), onSuccess: refetch }),
  }
}
