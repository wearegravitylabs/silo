import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../types'
import { AssistantMessage } from './assistant-message'
import { UserMessage } from './user-message'

const STICK_PX = 80 // within this distance of the bottom, new content keeps the view pinned to it

/** The conversation, scrolling on its own. Follows new content unless the user has scrolled up to read. */
export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const pinned = useRef(true)

  useEffect(() => {
    const el = ref.current
    if (el && pinned.current) el.scrollTop = el.scrollHeight
  }, [messages])

  return (
    <div
      ref={ref}
      onScroll={(e) => {
        const el = e.currentTarget
        pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_PX
      }}
      className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pt-5 pb-4"
    >
      {messages.map((m) => (m.role === 'user' ? <UserMessage key={m.id} text={m.text} /> : <AssistantMessage key={m.id} message={m} />))}
    </div>
  )
}
