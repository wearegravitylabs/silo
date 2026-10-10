// Palette content. Mock until actions and AI are wired to the app.

export interface QuickAction {
  id: string
  label: string
  icon: 'add' | 'upload'
  /** The section it belongs to, shown as a badge ("@Assets"). */
  mention: MentionToken
}

export type MentionToken = 'Assets' | 'Debts' | 'Vault'

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'add-stock', label: 'Add Stock', icon: 'add', mention: 'Assets' },
  { id: 'add-crypto', label: 'Add Crypto', icon: 'add', mention: 'Assets' },
  { id: 'add-real-estate', label: 'Add Real Estate', icon: 'add', mention: 'Assets' },
  { id: 'add-debt', label: 'Add Debt', icon: 'add', mention: 'Debts' },
  { id: 'upload-document', label: 'Upload Document', icon: 'upload', mention: 'Vault' },
]

/** Questions for Silo AI. */
export const SUGGESTIONS = ['How much did I make this month?', 'Show my crypto vs stocks allocation', 'Should I rebalance my portfolio?']

/** What "@" can mention in the palette, and what each suggests once picked. */
export const MENTIONS: { token: MentionToken; name: string; description: string; suggestions: string[] }[] = [
  {
    token: 'Assets',
    name: 'Asset',
    description: 'Create stocks, crypto, real estate',
    suggestions: ['Add a Stock asset', 'Add a Crypto asset', 'Add a Real Estate'],
  },
  {
    token: 'Debts',
    name: 'Debt',
    description: 'Create credit cards, loans, mortgages',
    suggestions: ['Add a Credit card', 'Add a Loan', 'Add a Mortgage'],
  },
  { token: 'Vault', name: 'Vault', description: 'Upload files to vault', suggestions: ['Upload a document'] },
]

/** A known mention in the text (for the blue chip). */
export const MENTION_RE = /(@(?:Assets|Debts|Vault)\b)/g
