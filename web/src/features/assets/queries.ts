import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import {
  addNote,
  createAsset,
  deleteAsset,
  deleteDocument,
  deleteNote,
  getAssetOverview,
  listAssets,
  listDocuments,
  listLots,
  listNotes,
  previewTicker,
  searchTicker,
  updateAsset,
  updateNote,
  uploadDocument,
} from './api'
import type { CreateAssetInput, NoteInput, UpdateAssetInput } from './types'

export const assetKeys = {
  all: (portfolioId: string) => ['assets', portfolioId] as const,
  /** folderId null = every asset in the portfolio */
  list: (portfolioId: string, folderId: string | null) => ['assets', portfolioId, 'list', folderId ?? 'all'] as const,
  overview: (portfolioId: string) => ['assets', portfolioId, 'overview'] as const,
  lots: (portfolioId: string, assetId: string) => ['assets', portfolioId, 'lots', assetId] as const,
  notes: (portfolioId: string, assetId: string) => ['assets', portfolioId, 'notes', assetId] as const,
  documents: (portfolioId: string, assetId: string) => ['assets', portfolioId, 'documents', assetId] as const,
  tickerSearch: (portfolioId: string, q: string) => ['ticker', portfolioId, 'search', q] as const,
  tickerPreview: (portfolioId: string, ticker: string) => ['ticker', portfolioId, 'preview', ticker] as const,
}

// ─── Lists & overview ─────────────────────────────────────────────────────────

/** Assets in one folder (or the whole portfolio when folderId is null). */
export const assetsQuery = (portfolioId: string, folderId: string | null) =>
  queryOptions({
    queryKey: assetKeys.list(portfolioId, folderId),
    queryFn: () => listAssets(portfolioId, folderId ?? undefined),
    staleTime: 60_000,
  })

export const assetOverviewQuery = (portfolioId: string) =>
  queryOptions({ queryKey: assetKeys.overview(portfolioId), queryFn: () => getAssetOverview(portfolioId), staleTime: 60_000 })

/** Folder's assets; keeps the previous folder's rows visible while switching (isPlaceholderData). */
export const useAssets = (portfolioId: string, folderId: string | null, { enabled = true } = {}) =>
  useQuery({ ...assetsQuery(portfolioId, folderId), enabled, placeholderData: keepPreviousData })

/** Portfolio totals. Suspends — preload with `assetOverviewQuery` in the route loader. */
export const useAssetOverview = (portfolioId: string) => useSuspenseQuery(assetOverviewQuery(portfolioId)).data

// ─── Ticker lookup ────────────────────────────────────────────────────────────

export const useTickerSearch = (portfolioId: string, q: string) =>
  useQuery({
    queryKey: assetKeys.tickerSearch(portfolioId, q),
    queryFn: () => searchTicker(portfolioId, q, 'stock'),
    enabled: q.length >= 1 && !!portfolioId,
    staleTime: 30_000,
  })

export const useTickerPreview = (portfolioId: string, ticker: string) =>
  useQuery({
    queryKey: assetKeys.tickerPreview(portfolioId, ticker),
    queryFn: () => previewTicker(portfolioId, ticker),
    enabled: !!portfolioId,
    staleTime: 60_000,
  })

// ─── Asset mutations ──────────────────────────────────────────────────────────
// Any asset change can move totals, so each one refetches every asset query for the portfolio.

const useInvalidateAssets = (portfolioId: string) => {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: assetKeys.all(portfolioId) })
}

export const useCreateAsset = (portfolioId: string) => {
  const invalidate = useInvalidateAssets(portfolioId)
  return useMutation({
    mutationFn: (data: CreateAssetInput) => createAsset(portfolioId, data),
    onSuccess: invalidate,
  })
}

export const useUpdateAsset = (portfolioId: string, assetId: string) => {
  const invalidate = useInvalidateAssets(portfolioId)
  return useMutation({
    mutationFn: (data: UpdateAssetInput) => updateAsset(portfolioId, assetId, data),
    onSuccess: invalidate,
  })
}

export const useDeleteAsset = (portfolioId: string, assetId: string) => {
  const invalidate = useInvalidateAssets(portfolioId)
  return useMutation({ mutationFn: () => deleteAsset(portfolioId, assetId), onSuccess: invalidate })
}

// ─── Per-asset sub-resources ──────────────────────────────────────────────────

export const useAssetLots = (portfolioId: string, assetId: string) =>
  useQuery({
    queryKey: assetKeys.lots(portfolioId, assetId),
    queryFn: () => listLots(portfolioId, assetId),
    staleTime: 60_000,
  })

export const useAssetNotes = (portfolioId: string, assetId: string, { enabled = true } = {}) =>
  useQuery({
    queryKey: assetKeys.notes(portfolioId, assetId),
    queryFn: () => listNotes(portfolioId, assetId),
    enabled,
    staleTime: 30_000,
  })

export const useNoteMutations = (portfolioId: string, assetId: string) => {
  const qc = useQueryClient()
  const refetch = () => qc.invalidateQueries({ queryKey: assetKeys.notes(portfolioId, assetId) })
  return {
    save: useMutation({
      mutationFn: ({ noteId, ...data }: NoteInput & { noteId?: string }) =>
        noteId ? updateNote(portfolioId, assetId, noteId, data) : addNote(portfolioId, assetId, data),
      onSuccess: refetch,
    }),
    remove: useMutation({ mutationFn: (noteId: string) => deleteNote(portfolioId, assetId, noteId), onSuccess: refetch }),
  }
}

export const useAssetDocuments = (portfolioId: string, assetId: string) =>
  useQuery({
    queryKey: assetKeys.documents(portfolioId, assetId),
    queryFn: () => listDocuments(portfolioId, assetId),
    staleTime: 30_000,
  })

export const useDocumentMutations = (portfolioId: string, assetId: string) => {
  const qc = useQueryClient()
  const refetch = () => qc.invalidateQueries({ queryKey: assetKeys.documents(portfolioId, assetId) })
  return {
    upload: useMutation({ mutationFn: (file: File) => uploadDocument(portfolioId, assetId, file), onSuccess: refetch }),
    remove: useMutation({ mutationFn: (docId: string) => deleteDocument(portfolioId, assetId, docId), onSuccess: refetch }),
  }
}
