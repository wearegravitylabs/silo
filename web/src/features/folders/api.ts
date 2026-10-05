import { api } from '@/lib/api-client'
import type { Folder, FolderType } from './types'

const base = (portfolioId: string) => `/portfolios/${portfolioId}/folders`

export const listFolders = (portfolioId: string, type: FolderType) =>
  api<Folder[] | null>(base(portfolioId), { params: { type } }).then((d) => d ?? [])

export const createFolder = (
  portfolioId: string,
  data: { name: string; folder_type: FolderType; icon?: string | null; image_url?: string | null },
) => api<Folder>(base(portfolioId), { method: 'POST', body: data })

export const updateFolder = (portfolioId: string, folderId: string, data: { name?: string; icon?: string | null }) =>
  api<Folder>(`${base(portfolioId)}/${folderId}`, { method: 'PATCH', body: data })

export const deleteFolder = (portfolioId: string, folderId: string) => api<null>(`${base(portfolioId)}/${folderId}`, { method: 'DELETE' })

export const reorderFolders = (portfolioId: string, folders: Array<{ id: string; position: number }>) =>
  api<null>(`${base(portfolioId)}/reorder`, { method: 'PUT', body: { folders } })
