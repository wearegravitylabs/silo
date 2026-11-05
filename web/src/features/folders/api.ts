import { api } from '@/lib/api-client'
import { isDemoPortfolio } from '@/lib/demo'
import { mockDelay } from '@/lib/mock'
import { defaultFolderId, fetchFolders, findUnfiledFolderId, FOLDER_COLORS, type ApiFolder } from '@/lib/folders'
import type { Folder, FolderType } from './types'

// Every portfolio has a default folder per type ("All Assets" / "All Debts") that lists everything and can't be
// renamed or deleted. It isn't an API folder: the API's own "General" folder stays hidden behind it (see lib/folders).
// The demo portfolios stay in memory, with the design's asset folders.
// TODO: API folders have no colour yet, so one is picked by position and the colour chosen in the dialog is dropped.
const later = mockDelay(300)
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

const mockList = (portfolioId: string, type: FolderType) =>
  later([...foldersOf(portfolioId, type)].sort((a, b) => a.position - b.position).map((f) => ({ ...f })))

const mockCreate = (portfolioId: string, data: { name: string; folder_type: FolderType; color?: string | null }) => {
  const list = foldersOf(portfolioId, data.folder_type)
  const created = {
    ...folder(portfolioId, data.folder_type, crypto.randomUUID(), data.name, list.length, data.color ?? BLUE),
    updated_at: new Date().toISOString(),
  }
  list.push(created)
  return later({ ...created })
}

const mockUpdate = (portfolioId: string, folderId: string, data: { name?: string; color?: string | null }) => {
  const target = find(portfolioId, folderId)
  if (!target) return Promise.reject(new Error('This folder no longer exists'))
  Object.assign(target, data, { updated_at: new Date().toISOString() })
  return later({ ...target })
}

const mockDelete = (portfolioId: string, folderId: string) => {
  const target = find(portfolioId, folderId)
  if (target) {
    const list = foldersOf(portfolioId, target.folder_type)
    list.splice(list.indexOf(target), 1)
  }
  return later(null)
}

const mockReorder = (portfolioId: string, folders: Array<{ id: string; position: number }>) => {
  for (const { id, position } of folders) {
    const target = find(portfolioId, id)
    if (target) target.position = position
  }
  return later(null)
}

// ─── API ──────────────────────────────────────────────────────────────────────

const fromApi = (f: ApiFolder, position: number): Folder => ({ ...f, color: null, position })

export async function listFolders(portfolioId: string, type: FolderType) {
  if (isDemoPortfolio(portfolioId)) return mockList(portfolioId, type)
  const { folders } = await fetchFolders(portfolioId, type)
  return [folder(portfolioId, type, defaultFolderId(type), DEFAULT_NAME[type], 0, null), ...folders.map((f, i) => fromApi(f, i + 1))]
}

export async function createFolder(portfolioId: string, data: { name: string; folder_type: FolderType; color?: string | null }) {
  if (isDemoPortfolio(portfolioId)) return mockCreate(portfolioId, data)
  const created = await api<ApiFolder>(`/portfolios/${portfolioId}/folders`, {
    method: 'POST',
    body: { name: data.name, folder_type: data.folder_type },
  })
  return fromApi(created, created.position)
}

export async function updateFolder(portfolioId: string, folderId: string, data: { name?: string; color?: string | null }) {
  if (isDemoPortfolio(portfolioId)) return mockUpdate(portfolioId, folderId, data)
  const updated = await api<ApiFolder>(`/portfolios/${portfolioId}/folders/${folderId}`, { method: 'PATCH', body: { name: data.name } })
  return fromApi(updated, updated.position)
}

/**
 * Deletes the folder. The API leaves its items in no folder, which the UI shows as the default one; `moveTo` only
 * matters to the mocks, where the page refiles items itself (see FolderTabs' onDeleted).
 */
export async function deleteFolder(portfolioId: string, folderId: string, _moveTo: string) {
  if (isDemoPortfolio(portfolioId)) return mockDelete(portfolioId, folderId)
  await api(`/portfolios/${portfolioId}/folders/${folderId}`, { method: 'DELETE' })
  return null
}

/** `folders` in their new order, the default folder included; the API gets every folder of the type, General first. */
export async function reorderFolders(portfolioId: string, folders: Array<{ id: string; position: number }>, type: FolderType) {
  if (isDemoPortfolio(portfolioId)) return mockReorder(portfolioId, folders)
  const unfiled = await findUnfiledFolderId(portfolioId, type)
  const ids = [...(unfiled ? [unfiled] : []), ...folders.filter((f) => f.id !== defaultFolderId(type)).map((f) => f.id)]
  await api(`/portfolios/${portfolioId}/folders/reorder`, { method: 'PUT', body: { folders: ids.map((id, position) => ({ id, position })) } })
  return null
}
