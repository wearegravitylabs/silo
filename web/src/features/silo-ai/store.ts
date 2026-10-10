import { createContext, useContext } from 'react'
import { createStore, useStore, type StoreApi } from 'zustand'
import { SEED_CHATS } from './mock-data'
import { mockReply, type MockReply } from './mock-engine'
import type { AssistantMessage, ChatMessage, PendingAction, SavedChat } from './types'

const WORD_MS = 35 // streaming speed

/** The part of a chat that can be saved, restored, or loaded from a dev preset. */
export interface ChatSnapshot {
  messages: ChatMessage[]
  draft: string
  pending: PendingAction | null
}

export interface SiloAiChatState extends ChatSnapshot {
  setDraft: (draft: string) => void
  /** Send a message: the assistant works, then streams its reply. */
  send: (text: string) => void
  /** Stop the assistant: keeps whatever has streamed so far. */
  stop: () => void
  /** Ask again after a failed reply: removes it and re-answers the question before it. */
  retry: (assistantMessageId: string) => void
  /** The open chat's id, and earlier chats ("Silo AI ⌄" → Recent chats), newest first. */
  chatId: string
  history: SavedChat[]
  /** Start a new chat; the current one (if it has messages) moves to history. */
  newChat: () => void
  /** Reopen a chat from history; the current one moves to history. */
  openChat: (id: string) => void
  /** Replace the open chat with a snapshot (dev presets). Cancels any in-flight reply. */
  load: (snapshot: ChatSnapshot) => void
}

const id = () => crypto.randomUUID()
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** A chat store. The app uses one shared instance; the dev gallery makes one per preview. */
export function createChatStore(initial?: Partial<ChatSnapshot>) {
  let runId = 0 // bumping it cancels the in-flight reply

  return createStore<SiloAiChatState>()((set, get) => {
    const updateAssistant = (messageId: string, patch: Partial<AssistantMessage>) =>
      set((s) => ({ messages: s.messages.map((m) => (m.id === messageId && m.role === 'assistant' ? { ...m, ...patch } : m)) }))

    /** History with the current chat filed at the top (if it has messages), marking a running reply stopped. */
    const archive = (): SavedChat[] => {
      runId++
      const { chatId, messages, pending, history } = get()
      if (messages.length === 0) return history
      const saved: SavedChat = {
        id: chatId,
        title: messages.find((m) => m.role === 'user')?.text ?? 'New chat',
        messages: messages.map((m) => (isRunning(m) ? { ...m, status: 'stopped' as const } : m)),
        pending,
      }
      return [saved, ...history.filter((c) => c.id !== chatId)]
    }

    /** The assistant's turn: working → streaming → done, or error if the reply fails. */
    const respond = async (prompt: string, retry = false) => {
      const run = ++runId
      let reply: MockReply | null = null
      let failure = 'Something went wrong. Please try again.'
      try {
        reply = mockReply(prompt, get().pending, { retry })
      } catch (e) {
        if (e instanceof Error && e.message) failure = e.message
      }

      const assistantId = id()
      set((s) => ({
        messages: [
          ...s.messages,
          {
            id: assistantId,
            role: 'assistant',
            status: 'working',
            label: reply?.label ?? 'Thinking',
            steps: reply?.steps ?? ['Reading your portfolio'],
            placeholder: reply?.placeholder ?? true,
            text: '',
            attachment: reply?.attachment,
            link: reply?.link,
          },
        ],
      }))

      await sleep(reply?.delay ?? 1200)
      if (run !== runId) return
      if (!reply) {
        updateAssistant(assistantId, { status: 'error', error: failure })
        return
      }
      updateAssistant(assistantId, { status: 'streaming' })

      // Stream word by word, keeping the whitespace (so paragraph breaks survive).
      const tokens = reply.text.match(/\S+\s*/g) ?? []
      let streamed = ''
      for (const token of tokens) {
        await sleep(WORD_MS)
        if (run !== runId) return
        streamed += token
        updateAssistant(assistantId, { text: streamed })
      }
      updateAssistant(assistantId, { status: 'done' })
      // Only a finished reply moves a multi-step action along; a stopped or failed one leaves it as it was.
      set({ pending: reply.pending ?? null })
    }

    return {
      draft: '',
      messages: [],
      pending: null,
      ...initial,
      setDraft: (draft) => set({ draft }),

      send: (text) => {
        set((s) => ({ draft: '', messages: [...s.messages, { id: id(), role: 'user', text }] }))
        void respond(text)
      },

      retry: (assistantMessageId) => {
        const { messages } = get()
        const index = messages.findIndex((m) => m.id === assistantMessageId)
        const question = messages
          .slice(0, index)
          .reverse()
          .find((m) => m.role === 'user')
        if (index < 0 || !question) return
        set({ messages: messages.filter((m) => m.id !== assistantMessageId) })
        void respond(question.text, true)
      },

      stop: () => {
        runId++
        const last = get().messages.at(-1)
        if (last && isRunning(last)) updateAssistant(last.id, { status: 'stopped' })
      },

      chatId: id(),
      history: SEED_CHATS,

      newChat: () => set({ history: archive(), chatId: id(), messages: [], draft: '', pending: null }),

      openChat: (chatId) => {
        const chat = get().history.find((c) => c.id === chatId)
        if (!chat || chat.id === get().chatId) return
        const history = archive().filter((c) => c.id !== chatId)
        set({ chatId: chat.id, messages: chat.messages, pending: chat.pending, draft: '', history })
      },

      load: (snapshot) => {
        runId++
        set({ ...snapshot, chatId: id() })
      },
    }
  })
}

const isRunning = (m: ChatMessage) => m.role === 'assistant' && (m.status === 'working' || m.status === 'streaming')

/** The app's chat (shared by every panel instance, survives closing the panel). */
const appStore = createChatStore()

/** Which chat store the components below use; defaults to the app's. The dev gallery provides its own. */
export const ChatStoreContext = createContext<StoreApi<SiloAiChatState>>(appStore)

export function useSiloAiChat(): SiloAiChatState
export function useSiloAiChat<T>(selector: (state: SiloAiChatState) => T): T
export function useSiloAiChat<T>(selector?: (state: SiloAiChatState) => T) {
  const store = useContext(ChatStoreContext)
  return useStore(store, selector ?? ((s) => s as T))
}

/** True while the assistant is working or streaming. */
export const selectBusy = (s: SiloAiChatState) => {
  const last = s.messages.at(-1)
  return !!last && isRunning(last)
}
