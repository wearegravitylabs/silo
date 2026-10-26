// Shared by the folders, assets and debts features (which can't import each other).

/**
 * Every portfolio has one default folder per kind ("All Assets", "All Debts"). It lists everything of that kind,
 * comes first, and can't be renamed or deleted.
 */
export const defaultFolderId = (type: 'asset' | 'debt') => (type === 'asset' ? 'all-assets' : 'all-debts')

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
