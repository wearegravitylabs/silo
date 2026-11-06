// Shared by the folders, assets and debts features (which can't import each other).
import { api } from './api-client'

type FolderType = 'asset' | 'debt'

/**
 * The default folder ("All Assets", "All Debts") lists everything of its kind, comes first, and can't be renamed or
 * deleted. Debts (still mocked) and the demo portfolios have one. A real portfolio's assets don't: every asset is in
 * one of the API's folders, so a folder must exist before an asset can be added.
 */
export const defaultFolderId = (type: FolderType) => (type === 'asset' ? 'all-assets' : 'all-debts')

/** A folder as the API returns it (no colour yet). */
export interface ApiFolder {
  id: string
  portfolio_id: string
  folder_type: FolderType
  name: string
  icon: string | null
  image_url: string | null
  position: number
  created_at: string
  updated_at: string
}

// The API makes a "General" folder of each kind with every portfolio. For debts, "All Debts" lists everything instead,
// so General stays hidden and holds whatever isn't filed elsewhere. For assets it's an ordinary folder.
const UNFILED = 'General'
const NO_FOLDER = '00000000-0000-0000-0000-000000000000'
const unfiledIds = new Map<string, string>()
const key = (portfolioId: string, type: FolderType) => `${portfolioId}:${type}`

/** A portfolio's folders of one kind, in order, split into the hidden General folder (debts only) and the rest. */
export async function fetchFolders(portfolioId: string, type: FolderType) {
  const list = (await api<ApiFolder[] | null>(`/portfolios/${portfolioId}/folders`, { params: { type } })) ?? []
  const sorted = [...list].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at))
  const unfiled = type === 'debt' ? sorted.find((f) => f.name === UNFILED) : undefined
  if (unfiled) unfiledIds.set(key(portfolioId, type), unfiled.id)
  return { unfiled, folders: sorted.filter((f) => f !== unfiled) }
}

/** The hidden folder's id, if the portfolio has one. */
export async function findUnfiledFolderId(portfolioId: string, type: FolderType) {
  return unfiledIds.get(key(portfolioId, type)) ?? (await fetchFolders(portfolioId, type)).unfiled?.id
}

/** An API folder id as the UI sees it: null (unfiled) for the hidden folder, and for none (its folder was deleted). */
export const fromApiFolderId = (portfolioId: string, type: FolderType, folderId: string | null | undefined) =>
  !folderId || folderId === NO_FOLDER || folderId === unfiledIds.get(key(portfolioId, type)) ? null : folderId

/** Folder colours, in the Create/Edit Folder swatch order (blue, lime, red, orange, green, magenta, purple). */
export const FOLDER_COLORS = [
  'var(--color-folder-1)',
  'var(--color-folder-2)',
  'var(--color-folder-3)',
  'var(--color-folder-4)',
  'var(--color-folder-5)',
  'var(--color-folder-6)',
  'var(--color-folder-7)',
] as const

/** A folder's colour: its own, else one picked by its place in the list. */
export const folderColor = (folder: { color?: string | null }, index: number) => folder.color ?? FOLDER_COLORS[index % FOLDER_COLORS.length]
