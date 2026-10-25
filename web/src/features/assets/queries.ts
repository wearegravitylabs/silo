import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import {
  connectProvider,
  createAsset,
  createValuedAsset,
  deleteAsset,
  getAssetsOverview,
  listAssets,
  moveAsset,
  searchAddresses,
  searchTickers,
} from './api'
import type { ConnectInput, CreateAssetInput, CreateValuedAssetInput, TickerKind } from './types'

export const assetKeys = {
  all: (portfolioId: string) => ['assets', portfolioId] as const,
  /** folderId null = every asset in the portfolio */
  list: (portfolioId: string, folderId: string | null) => ['assets', portfolioId, 'list', folderId ?? 'all'] as const,
  overview: (portfolioId: string) => ['assets', portfolioId, 'overview'] as const,
  tickerSearch: (kind: TickerKind, q: string) => ['ticker-search', kind, q] as const,
  addressSearch: (q: string) => ['address-search', q] as const,
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

/** Ticker search; keeps the last results on screen while the next query loads. */
export const useTickerSearch = (kind: TickerKind, q: string) =>
  useQuery({
    queryKey: assetKeys.tickerSearch(kind, q),
    queryFn: () => searchTickers(kind, q),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

/** Address suggestions while typing; keeps the last ones on screen while the next load. */
export const useAddressSearch = (q: string) =>
  useQuery({
    queryKey: assetKeys.addressSearch(q),
    queryFn: () => searchAddresses(q),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

/** Create, move to a folder, delete — each refetches every asset query for the portfolio (lists, total). */
export const useAssetMutations = (portfolioId: string) => {
  const qc = useQueryClient()
  const refetch = () => qc.invalidateQueries({ queryKey: assetKeys.all(portfolioId) })
  return {
    create: useMutation({ mutationFn: (input: CreateAssetInput) => createAsset(portfolioId, input), onSuccess: refetch }),
    connect: useMutation({ mutationFn: (input: ConnectInput) => connectProvider(portfolioId, input), onSuccess: refetch }),
    createValued: useMutation({ mutationFn: (input: CreateValuedAssetInput) => createValuedAsset(portfolioId, input), onSuccess: refetch }),
    move: useMutation({
      mutationFn: ({ id, folderId }: { id: string; folderId: string }) => moveAsset(portfolioId, id, folderId),
      onSuccess: refetch,
    }),
    remove: useMutation({ mutationFn: (id: string) => deleteAsset(portfolioId, id), onSuccess: refetch }),
  }
}
