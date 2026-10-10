/** What the assistant shows while it works ("Thinking…"). */
export type WorkingLabel = 'Thinking' | 'Executing' | 'Processing'

/**
 * working → streaming → done. `stopped`: the user pressed Stop (keeps whatever had streamed).
 * `error`: the reply failed (offered a Retry). Text may mark **bold** spans; blank lines separate paragraphs.
 */
export type AssistantStatus = 'working' | 'streaming' | 'done' | 'stopped' | 'error'

/** A preview of something the assistant is about to create (shown under its reply). */
export interface AssetAttachment {
  kind: 'asset'
  name: string
  value: string
  /** Short mark drawn on the logo tile, e.g. "S&P". */
  mark: string
}

/** A follow-up the assistant offers once its reply is done. */
export interface ReplyLink {
  label: string
  /** App section the link opens, inside the current portfolio. */
  section: 'assets' | 'dashboard'
}

/** An action the assistant is waiting to complete (e.g. it asked for a date before creating an asset). */
export interface PendingAction {
  kind: 'create-asset'
  name: string
}

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | {
      id: string
      role: 'assistant'
      status: AssistantStatus
      label: WorkingLabel
      /** Reasoning steps shown when the "Thinking… ⌄" label is expanded. */
      steps: string[]
      /** Show shimmer bars under the label while working (the design omits them for "Processing…"). */
      placeholder: boolean
      text: string
      attachment?: AssetAttachment
      link?: ReplyLink
      /** What went wrong, when status is `error`. */
      error?: string
    }

export type AssistantMessage = Extract<ChatMessage, { role: 'assistant' }>

/** A conversation kept in the "Silo AI ⌄" recent chats list. */
export interface SavedChat {
  id: string
  title: string
  messages: ChatMessage[]
  pending: PendingAction | null
}
