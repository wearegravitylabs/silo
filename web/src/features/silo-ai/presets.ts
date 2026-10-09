// Every Silo AI screen as a frozen state, for the dev gallery (/dev/silo-ai) and the dev state switcher.
// Mirrors the design screens in order.
import type { ChatSnapshot } from './store'
import type { AssistantMessage, ChatMessage } from './types'

export interface ChatPreset {
  id: string
  label: string
  snapshot: ChatSnapshot
}

const EARNINGS_Q = 'How much did I make this month?'
const EARNINGS_A =
  'You made **₦10,000.00** over the past month.\n\nThis gain represents a **12% growth**, pushing your total net worth to the **₦1,000,000.00** milestone.'
const CREATE_Q = '@Assets create a SP500 stock asset with 10,000 shares at a price of 100$ per share'
const CREATE_A = "You're about to create an Asset SP500. Kindly specify the acquisition date to confirm creation"
const DATE_Q = 'I got it March 10, 2025'
const SUCCESS_A = 'Asset S&P500 has been created successfully. Please proceed to the Asset page to view the details.'
const SP500 = { kind: 'asset', name: 'S&P500', value: '$1,000,000.00', mark: 'S&P' } as const
const CREATE_PENDING = { kind: 'create-asset', name: 'S&P500' } as const

const user = (id: string, text: string): ChatMessage => ({ id, role: 'user', text })
const assistant = (id: string, patch: Partial<AssistantMessage>): ChatMessage => ({
  id,
  role: 'assistant',
  status: 'done',
  label: 'Thinking',
  steps: ['Reading your net worth history', 'Comparing today with one month ago'],
  placeholder: true,
  text: '',
  ...patch,
})

const answered = [user('u1', EARNINGS_Q), assistant('a1', { text: EARNINGS_A })]
const created = [
  ...answered,
  user('u2', CREATE_Q),
  assistant('a2', { label: 'Executing', steps: ['Reading the asset details', 'Looking up S&P500'], text: CREATE_A, attachment: SP500 }),
]

const snap = (messages: ChatMessage[], draft = '', pending: ChatSnapshot['pending'] = null): ChatSnapshot => ({ messages, draft, pending })

export const CHAT_PRESETS: ChatPreset[] = [
  { id: 'welcome', label: 'Welcome', snapshot: snap([]) },
  { id: 'typing', label: 'Typing (send ready)', snapshot: snap([], EARNINGS_Q) },
  { id: 'thinking', label: 'Thinking…', snapshot: snap([user('u1', EARNINGS_Q), assistant('a1', { status: 'working' })]) },
  {
    id: 'streaming',
    label: 'Streaming reply',
    snapshot: snap([user('u1', EARNINGS_Q), assistant('a1', { status: 'streaming', text: 'You made **₦10,000.00** over the past' })]),
  },
  { id: 'answered', label: 'Answered', snapshot: snap(answered) },
  {
    id: 'stopped',
    label: 'Stopped by user',
    snapshot: snap([user('u1', EARNINGS_Q), assistant('a1', { status: 'stopped', text: 'You made **₦10,000.00** over the past' })]),
  },
  {
    id: 'error',
    label: 'Reply failed (Retry)',
    snapshot: snap([
      user('u1', EARNINGS_Q),
      assistant('a1', {
        status: 'error',
        error: "Silo AI couldn't reach your portfolio data. Check your connection and try again.",
      }),
    ]),
  },
  {
    id: 'long-message',
    label: 'Long words wrap',
    snapshot: snap([
      user('u1', 'Check https://app.silo.com/portfolio/retirement/assets?folder=investments&sort=value-desc&view=cards for me'),
      assistant('a1', { text: 'Account **NG12SILO000000000000004491827364** is linked to that view and wraps instead of overflowing.' }),
    ]),
  },
  { id: 'mention-open', label: '@mention menu open', snapshot: snap(answered, '@') },
  { id: 'mention-picked', label: '@mention inserted', snapshot: snap(answered, CREATE_Q.replace('create', 'Create')) },
  {
    id: 'executing',
    label: 'Executing…',
    snapshot: snap([
      ...answered,
      user('u2', CREATE_Q),
      assistant('a2', { status: 'working', label: 'Executing', steps: ['Reading the asset details', 'Looking up S&P500'] }),
    ]),
  },
  { id: 'asset-card', label: 'Asset card (asks for date)', snapshot: snap(created, '', CREATE_PENDING) },
  {
    id: 'processing',
    label: 'Processing…',
    snapshot: snap(
      [
        ...created,
        user('u3', DATE_Q),
        assistant('a3', { status: 'working', label: 'Processing', placeholder: false, steps: ['Creating S&P500'] }),
      ],
      '',
      CREATE_PENDING,
    ),
  },
  {
    id: 'success',
    label: 'Asset created',
    snapshot: snap([
      ...created,
      user('u3', DATE_Q),
      assistant('a3', { label: 'Processing', placeholder: false, text: SUCCESS_A, link: { label: 'View in Assets', section: 'assets' } }),
    ]),
  },
]

/** Prompts the dev switcher can play live through the mock engine (the scripted flows). */
export const SCRIPTED_PROMPTS = [EARNINGS_Q, CREATE_Q, DATE_Q, 'Simulate an error']
