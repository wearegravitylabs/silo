// Mock content for Silo AI until the API exists.
import type { ChatMessage, SavedChat } from './types'

/** Prompt suggestions shown on the welcome screen and above the composer in a conversation. */
export const SUGGESTIONS = ['How much did I make this month?', 'Show my crypto vs stocks allocation', 'Should I rebalance my portfolio?']

/** Something the user can @mention. `token` is what's inserted ("@Assets"). */
export type MentionOption =
  | { kind: 'partner'; id: string; token: string; name: string; email: string; initials: string; tone: 'brand' | 'lime' }
  | { kind: 'section'; id: string; token: string; name: string; description: string }

export const MENTION_OPTIONS: MentionOption[] = [
  {
    kind: 'partner',
    id: 'p1',
    token: 'Daniel',
    name: 'Daniel Osonuga',
    email: 'osonuga.daniel@gmail.com',
    initials: 'D',
    tone: 'brand',
  },
  { kind: 'partner', id: 'p2', token: 'John', name: 'John Doe', email: 'john.doe@gmail.com', initials: 'J', tone: 'lime' },
  { kind: 'section', id: 's1', token: 'Assets', name: 'Asset', description: 'Stocks, Crypto, Real estate' },
  { kind: 'section', id: 's2', token: 'Debts', name: 'Debt', description: 'Credit cards, Loans, Mortgages' },
  { kind: 'section', id: 's3', token: 'Vault', name: 'Vault', description: 'Upload files to vault' },
]

/** Matches a known @mention in text (used to highlight it). */
export const MENTION_RE = new RegExp(`(@(?:${MENTION_OPTIONS.map((o) => o.token).join('|')})\\b)`, 'g')

const qa = (id: string, question: string, answer: string): ChatMessage[] => [
  { id: `${id}-q`, role: 'user', text: question },
  { id: `${id}-a`, role: 'assistant', status: 'done', label: 'Thinking', steps: [], placeholder: true, text: answer },
]

/** Earlier conversations shown under "Recent chats". */
export const SEED_CHATS: SavedChat[] = [
  {
    id: 'seed-1',
    title: 'Show my crypto vs stocks allocation',
    pending: null,
    messages: qa(
      'seed-1',
      'Show my crypto vs stocks allocation',
      'Stocks make up **40%** of your assets across **6** holdings, while crypto is **30%** across **4**.\n\nTogether they are **70%** of your portfolio.',
    ),
  },
  {
    id: 'seed-2',
    title: 'Should I rebalance my portfolio?',
    pending: null,
    messages: qa(
      'seed-2',
      'Should I rebalance my portfolio?',
      'Your crypto share (**30%**) is on the high side for a retirement portfolio.\n\nMoving part of it into stocks or cash would lower your exposure to big swings. This is general guidance, not financial advice.',
    ),
  },
]
