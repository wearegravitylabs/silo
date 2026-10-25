import { useRef, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PendingUpload } from '@/components/documents-tab-view'
import type { ChartPeriod } from '@/lib/periods'
import {
  addAssetHistory,
  deleteAssetDocument,
  deleteAssetNote,
  deleteAssetRule,
  getAssetChart,
  getAssetStats,
  listAssetDocuments,
  listAssetHistory,
  listAssetNotes,
  listAssetRules,
  saveAssetNote,
  toggleAssetRule,
  updateAsset,
  uploadAssetDocument,
} from './panel-api'
import { assetKeys } from './queries'
import type { AddAssetHistoryInput, AssetNoteInput, Investability } from './types'

// The detail panel's queries. Every key sits under the portfolio's asset key, and every change refetches all of
// them: history moves the table, the header total and the panel together.

const panelKey = (portfolioId: string, assetId: string, part: string, ...rest: string[]) =>
  [...assetKeys.all(portfolioId), 'panel', assetId, part, ...rest] as const

const useRefetchAssets = (portfolioId: string) => {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: assetKeys.all(portfolioId) })
}

export const useAssetHistory = (portfolioId: string, assetId: string) =>
  useQuery({ queryKey: panelKey(portfolioId, assetId, 'history'), queryFn: () => listAssetHistory(portfolioId, assetId) })

export const useAssetStats = (portfolioId: string, assetId: string) =>
  useQuery({ queryKey: panelKey(portfolioId, assetId, 'stats'), queryFn: () => getAssetStats(portfolioId, assetId) })

/** Keeps the last period's line on screen while the next loads. */
export const useAssetChart = (portfolioId: string, assetId: string, period: ChartPeriod) =>
  useQuery({
    queryKey: panelKey(portfolioId, assetId, 'chart', period),
    queryFn: () => getAssetChart(portfolioId, assetId, period),
    placeholderData: keepPreviousData,
  })

export const useAddAssetHistory = (portfolioId: string, assetId: string) =>
  useMutation({
    mutationFn: (input: AddAssetHistoryInput) => addAssetHistory(portfolioId, assetId, input),
    onSuccess: useRefetchAssets(portfolioId),
  })

/** Investable or not, and the share you own. */
export const useUpdateAsset = (portfolioId: string, assetId: string) =>
  useMutation({
    mutationFn: (patch: { investability?: Investability; ownership_pct?: number }) => updateAsset(portfolioId, assetId, patch),
    onSuccess: useRefetchAssets(portfolioId),
  })

export const useAssetRules = (portfolioId: string, assetId: string) =>
  useQuery({ queryKey: panelKey(portfolioId, assetId, 'rules'), queryFn: () => listAssetRules(assetId) })

export const useAssetRuleMutations = (portfolioId: string) => {
  const onSuccess = useRefetchAssets(portfolioId)
  return {
    toggle: useMutation({ mutationFn: toggleAssetRule, onSuccess }),
    remove: useMutation({ mutationFn: deleteAssetRule, onSuccess }),
  }
}

export const useAssetNotes = (portfolioId: string, assetId: string) =>
  useQuery({ queryKey: panelKey(portfolioId, assetId, 'notes'), queryFn: () => listAssetNotes(assetId) })

export const useAssetNoteMutations = (portfolioId: string, assetId: string) => {
  const onSuccess = useRefetchAssets(portfolioId)
  return {
    save: useMutation({ mutationFn: (input: AssetNoteInput & { noteId?: string }) => saveAssetNote(assetId, input), onSuccess }),
    remove: useMutation({ mutationFn: deleteAssetNote, onSuccess }),
  }
}

export const useAssetDocuments = (portfolioId: string, assetId: string) =>
  useQuery({ queryKey: panelKey(portfolioId, assetId, 'documents'), queryFn: () => listAssetDocuments(assetId) })

/** Uploads with progress (listed until done; cancel aborts one), and delete. */
export const useAssetDocumentMutations = (portfolioId: string, assetId: string) => {
  const refetch = useRefetchAssets(portfolioId)
  const [uploads, setUploads] = useState<PendingUpload[]>([])
  const controllers = useRef(new Map<string, AbortController>())
  const drop = (id: string) => {
    controllers.current.delete(id)
    setUploads((list) => list.filter((u) => u.id !== id))
  }

  const upload = (file: File) => {
    const id = crypto.randomUUID()
    const controller = new AbortController()
    controllers.current.set(id, controller)
    setUploads((list) => [{ id, file_name: file.name, file_size: file.size, progress: 0 }, ...list])
    uploadAssetDocument(
      assetId,
      file,
      (progress) => setUploads((list) => list.map((u) => (u.id === id ? { ...u, progress } : u))),
      controller.signal,
    )
      .then(() => refetch())
      .catch((e) => e?.name !== 'AbortError' && toast.error(`Couldn’t upload ${file.name}. Try again.`))
      .finally(() => drop(id))
  }

  return {
    uploads,
    upload,
    cancel: (id: string) => controllers.current.get(id)?.abort(),
    remove: useMutation({ mutationFn: deleteAssetDocument, onSuccess: refetch }),
  }
}
