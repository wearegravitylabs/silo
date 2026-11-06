// Shared by the folders, assets and debts features (which can't import each other).
import { api } from './api-client'

type FolderType = 'asset' | 'debt'

/**
 * The demo portfolios' default folder ("All Assets", "All Debts"): it lists everything of its kind, comes first, and
 * can't be renamed or deleted. A real portfolio has none: every asset and debt is in one of the API's folders, so a
 * folder must exist before one can be added.
 */
export const defaultFolderId = (type: FolderType) => (type === 'asset' ? 'all-assets' : 'all-debts')

/** A folder as the API returns it (no colour field yet: the folders feature keeps it in `icon`). */
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

/** A portfolio's folders of one kind, in order (the "General" one the API makes with every portfolio included). */
export async function fetchFolders(portfolioId: string, type: FolderType) {
  const list = (await api<ApiFolder[] | null>(`/portfolios/${portfolioId}/folders`, { params: { type } })) ?? []
  return [...list].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at))
}

const NO_FOLDER = '00000000-0000-0000-0000-000000000000'

/** An API folder id as the UI sees it: null for none (e.g. its folder was deleted). */
export const fromApiFolderId = (folderId: string | null | undefined) => (!folderId || folderId === NO_FOLDER ? null : folderId)

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
