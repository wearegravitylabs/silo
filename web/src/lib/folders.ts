// Shared by the folders, assets and debts features (which can't import each other).

/**
 * Every portfolio has one default folder per kind ("All Assets", "All Debts"). It lists everything of that kind,
 * comes first, and can't be renamed or deleted.
 */
export const defaultFolderId = (type: 'asset' | 'debt') => (type === 'asset' ? 'all-assets' : 'all-debts')
