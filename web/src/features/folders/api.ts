import { api } from '@/lib/api-client'
import { isDemoPortfolio } from '@/lib/demo'
import { mockDelay } from '@/lib/mock'
import { defaultFolderId, fetchFolders, FOLDER_COLORS, type ApiFolder } from '@/lib/folders'
import type { Folder, FolderType } from './types'

// A real portfolio's folders are the API's, as they are: every asset and debt is in one, so there's no "All Assets"
// or "All Debts". The demo portfolios stay in memory, with the design's folders and a default folder per type.
// TODO: API folders have no colour field yet, so the colour is kept in `icon` as "color:folder-N" (see fromApi).
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

// Prefixed, so it can't pass for an emoji icon and is easy to move once folders get a colour field.
const ICON_PREFIX = 'color:folder-'
/** The `icon` that stores a FOLDER_COLORS colour; undefined (left as it is) for any other. */
const colorIcon = (color?: string | null) => {
  const i = FOLDER_COLORS.findIndex((c) => c === color)
  return i === -1 ? undefined : `${ICON_PREFIX}${i + 1}`
}
/** The colour stored in `icon`; null (picked by position) when it holds none. */
const iconColor = (icon: string | null) =>
  icon?.startsWith(ICON_PREFIX) ? (FOLDER_COLORS[Number(icon.slice(ICON_PREFIX.length)) - 1] ?? null) : null

const fromApi = (f: ApiFolder, position: number): Folder => ({ ...f, icon: null, color: iconColor(f.icon), position })

export async function listFolders(portfolioId: string, type: FolderType) {
  if (isDemoPortfolio(portfolioId)) return mockList(portfolioId, type)
  return (await fetchFolders(portfolioId, type)).map(fromApi)
}

export async function createFolder(portfolioId: string, data: { name: string; folder_type: FolderType; color?: string | null }) {
  if (isDemoPortfolio(portfolioId)) return mockCreate(portfolioId, data)
  const created = await api<ApiFolder>(`/portfolios/${portfolioId}/folders`, {
    method: 'POST',
    body: { name: data.name, folder_type: data.folder_type, icon: colorIcon(data.color) },
  })
  return fromApi(created, created.position)
}

export async function updateFolder(portfolioId: string, folderId: string, data: { name?: string; color?: string | null }) {
  if (isDemoPortfolio(portfolioId)) return mockUpdate(portfolioId, folderId, data)
  const updated = await api<ApiFolder>(`/portfolios/${portfolioId}/folders/${folderId}`, {
    method: 'PATCH',
    body: { name: data.name, icon: colorIcon(data.color) },
  })
  return fromApi(updated, updated.position)
}

/**
 * Deletes the folder, its assets or debts moved to `moveTo` first: the API would leave them in no folder, where no tab
 * shows them. (Null when it has none to move.) The demo's mocks refile their items through the page (see FolderTabs'
 * onDeleted).
 */
export async function deleteFolder(portfolioId: string, folderId: string, moveTo: string | null, type: FolderType) {
  if (isDemoPortfolio(portfolioId)) return mockDelete(portfolioId, folderId)
  if (moveTo) {
    const items = `/portfolios/${portfolioId}/${type === 'asset' ? 'assets' : 'debts'}`
    // Every item, filtered here: the API rejects ?folder_id= on debts. TODO: backend fix.
    const all = (await api<Array<{ id: string; folder_id?: string | null }> | null>(items)) ?? []
    for (const { id } of all.filter((i) => i.folder_id === folderId))
      await api(`${items}/${id}`, { method: 'PATCH', body: { folder_id: moveTo } })
  }
  await api(`/portfolios/${portfolioId}/folders/${folderId}`, { method: 'DELETE' })
  return null
}

/** `folders` in their new order: every folder of the type. */
export async function reorderFolders(portfolioId: string, folders: Array<{ id: string; position: number }>) {
  if (isDemoPortfolio(portfolioId)) return mockReorder(portfolioId, folders)
  await api(`/portfolios/${portfolioId}/folders/reorder`, {
    method: 'PUT',
    body: { folders: folders.map(({ id }, position) => ({ id, position })) },
  })
  return null
}
