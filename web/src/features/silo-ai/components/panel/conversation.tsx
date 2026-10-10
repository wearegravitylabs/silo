import { SUGGESTIONS } from '../../mock-data'
import { selectBusy, useSiloAiChat } from '../../store'
import { Composer } from '../composer/composer'
import { Suggestions } from '../composer/suggestions'
import { MessageList } from '../messages/message-list'

/** An ongoing chat: messages above; suggestions, composer and the disclaimer docked at the bottom. */
export function Conversation() {
  const { messages, draft, setDraft, send, stop } = useSiloAiChat()
  const busy = useSiloAiChat(selectBusy)

  return (
    <>
      <MessageList messages={messages} />
      <div className="flex shrink-0 flex-col gap-3 px-4 pt-2 pb-3">
        <Suggestions items={SUGGESTIONS} onPick={setDraft} layout="row" />
        <Composer value={draft} onChange={setDraft} onSubmit={send} busy={busy} onStop={stop} emptyIcon="plane" autoFocus />
        <p className="text-center text-xs leading-5 text-muted-foreground">Silo AI can make mistake. Always recheck</p>
      </div>
    </>
  )
}
