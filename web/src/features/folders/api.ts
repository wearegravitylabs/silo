import { defaultFolderId, FOLDER_COLORS } from '@/lib/folders'
import type { Folder, FolderType } from './types'

// TODO: mocked because portfolios are mocked (the real API doesn't know the demo portfolio). Real endpoints:
//   GET    /portfolios/:id/folders?type=…     POST   /portfolios/:id/folders
//   PATCH  /portfolios/:id/folders/:folderId  DELETE /portfolios/:id/folders/:folderId?move_to=…
//   PUT    /portfolios/:id/folders/reorder
// Every portfolio has a default folder per type ("All Assets" / "All Debts") that lists everything and can't be
// renamed or deleted; the demo portfolio also has the design's asset folders.
const DELAY = 300
const later = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY))
const CREATED = '2026-01-01T00:00:00Z'

const DEFAULT_NAME: Record<FolderType, string> = { asset: 'All Assets', debt: 'All Debts' }

const [BLUE, LIME, , , , , PURPLE] = FOLDER_COLORS

const folder = (
  portfolioId: string,
  type: FolderType,
  id: string,
  name: string,
  position: number,
  color: string | null = BLUE,
): Folder => ({
  id,
  portfolio_id: portfolioId,
  folder_type: type,
  name,
  icon: null,
  image_url: null,
  color,
  position,
  created_at: CREATED,
  updated_at: CREATED,
})

const store = new Map<string, Folder[]>()
const foldersOf = (portfolioId: string, type: FolderType) => {
  const key = `${portfolioId}:${type}`
  if (!store.has(key)) {
    const list = [folder(portfolioId, type, defaultFolderId(type), DEFAULT_NAME[type], 0)]
    if (portfolioId === 'demo' && type === 'asset') {
      list.push(
        folder(portfolioId, type, 'plaid-wells-fargo', 'Plaid - Wells Fargo', 1, PURPLE),
        folder(portfolioId, type, 'coinbase', 'Coinbase', 2, LIME),
      )
    }
    store.set(key, list)
  }
  return store.get(key)!
}
const find = (portfolioId: string, folderId: string) =>
  [...store.entries()]
    .filter(([key]) => key.startsWith(`${portfolioId}:`))
    .flatMap(([, list]) => list)
    .find((f) => f.id === folderId)

export const listFolders = (portfolioId: string, type: FolderType) =>
  later([...foldersOf(portfolioId, type)].sort((a, b) => a.position - b.position).map((f) => ({ ...f })))

export const createFolder = (portfolioId: string, data: { name: string; folder_type: FolderType; color?: string | null }) => {
  const list = foldersOf(portfolioId, data.folder_type)
  const created = {
    ...folder(portfolioId, data.folder_type, crypto.randomUUID(), data.name, list.length, data.color ?? BLUE),
    updated_at: new Date().toISOString(),
  }
  list.push(created)
  return later({ ...created })
}

export const updateFolder = (portfolioId: string, folderId: string, data: { name?: string; color?: string | null }) => {
  const target = find(portfolioId, folderId)
  if (!target) return Promise.reject(new Error('This folder no longer exists'))
  Object.assign(target, data, { updated_at: new Date().toISOString() })
  return later({ ...target })
}

/**
 * Deletes the folder; the backend files its items in `moveTo` (the default folder: unfiled). Items live in their own
 * features' mocks, so the page refiles them there too (see FolderTabs' onDeleted).
 */
export const deleteFolder = (portfolioId: string, folderId: string, _moveTo: string) => {
  const target = find(portfolioId, folderId)
  if (target) {
    const list = foldersOf(portfolioId, target.folder_type)
    list.splice(list.indexOf(target), 1)
  }
  return later(null)
}

export const reorderFolders = (portfolioId: string, folders: Array<{ id: string; position: number }>) => {
  for (const { id, position } of folders) {
    const target = find(portfolioId, id)
    if (target) target.position = position
  }
  return later(null)
}
