import { api } from '@/lib/api-client'
import type {
  AssetDocument,
  AssetItem,
  AssetLot,
  AssetNote,
  AssetOverview,
  CreateAssetInput,
  NoteInput,
  TickerQuote,
  TickerSearchResult,
  UpdateAssetInput,
  UploadedFile,
} from './types'

const base = (portfolioId: string) => `/portfolios/${portfolioId}/assets`
const one = (portfolioId: string, assetId: string) => `${base(portfolioId)}/${assetId}`
const orEmpty = <T>(d: T[] | null) => d ?? []

/** The API stores note tags as { items: [...] }. */
const tagsBody = (tags: string[] | undefined, forUpdate: boolean) => {
  if (tags === undefined) return undefined
  if (tags.length) return { items: tags }
  return forUpdate ? {} : undefined
}

function formData(file: File) {
  const form = new FormData()
  form.append('file', file)
  return form
}

export const getAssetOverview = (portfolioId: string) => api<AssetOverview>(`${base(portfolioId)}/overview`)

export const listAssets = (portfolioId: string, folderId?: string) =>
  api<AssetItem[] | null>(base(portfolioId), { params: { folder_id: folderId } }).then(orEmpty)

export const searchTicker = (portfolioId: string, q: string, type: 'stock' | 'crypto' = 'stock') =>
  api<TickerSearchResult[] | null>(`${base(portfolioId)}/ticker/search`, { params: { q, type } }).then(orEmpty)

export const previewTicker = (portfolioId: string, ticker: string) =>
  api<TickerQuote>(`${base(portfolioId)}/ticker/preview`, { params: { ticker } })

export const createAsset = (portfolioId: string, data: CreateAssetInput) =>
  api<AssetItem>(base(portfolioId), { method: 'POST', body: data })

export const updateAsset = (portfolioId: string, assetId: string, data: UpdateAssetInput) =>
  api<AssetItem>(one(portfolioId, assetId), { method: 'PATCH', body: data })

export const deleteAsset = (portfolioId: string, assetId: string) => api<null>(one(portfolioId, assetId), { method: 'DELETE' })

export const listLots = (portfolioId: string, assetId: string) => api<AssetLot[] | null>(`${one(portfolioId, assetId)}/lots`).then(orEmpty)

export const listNotes = (portfolioId: string, assetId: string) =>
  api<AssetNote[] | null>(`${one(portfolioId, assetId)}/notes`).then(orEmpty)

export const addNote = (portfolioId: string, assetId: string, { tags, ...data }: NoteInput) =>
  api<AssetNote>(`${one(portfolioId, assetId)}/notes`, {
    method: 'POST',
    body: { ...data, tags: tagsBody(tags, false) },
  })

export const updateNote = (portfolioId: string, assetId: string, noteId: string, { tags, ...data }: NoteInput) =>
  api<AssetNote>(`${one(portfolioId, assetId)}/notes/${noteId}`, {
    method: 'PATCH',
    body: { ...data, tags: tagsBody(tags, true) },
  })

export const deleteNote = (portfolioId: string, assetId: string, noteId: string) =>
  api<null>(`${one(portfolioId, assetId)}/notes/${noteId}`, { method: 'DELETE' })

export const listDocuments = (portfolioId: string, assetId: string) =>
  api<AssetDocument[] | null>(`${one(portfolioId, assetId)}/documents`).then(orEmpty)

export const uploadDocument = (portfolioId: string, assetId: string, file: File) =>
  api<AssetDocument>(`${one(portfolioId, assetId)}/documents`, { method: 'POST', body: formData(file) })

export const getDocumentDownloadUrl = (portfolioId: string, assetId: string, docId: string) =>
  api<{ url: string; expires_in: number }>(`${one(portfolioId, assetId)}/documents/${docId}/download-url`)

export const deleteDocument = (portfolioId: string, assetId: string, docId: string) =>
  api<null>(`${one(portfolioId, assetId)}/documents/${docId}`, { method: 'DELETE' })

/** Generic file upload (asset images). */
export const uploadFile = (file: File) => api<UploadedFile>('/upload', { method: 'POST', body: formData(file) })
