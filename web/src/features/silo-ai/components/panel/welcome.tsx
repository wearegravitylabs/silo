import { SUGGESTIONS } from '../../mock-data'
import { useSiloAiChat } from '../../store'
import { AiAvatar } from '../shared/ai-avatar'
import { Composer } from '../composer/composer'
import { Suggestions } from '../composer/suggestions'

/** First screen of a chat: greeting, composer, and suggestions that fill the composer when picked. */
export function Welcome({ firstName }: { firstName?: string }) {
  const { draft, setDraft, send } = useSiloAiChat()

  return (
    <div className="flex flex-col items-center px-4 pt-8 pb-6">
      <AiAvatar className="size-10 animate-rise" />
      <p className="mt-3 animate-rise">{firstName ? `Hi, ${firstName}` : 'Hi there'}</p>
      <h2 className="mt-2 max-w-64 animate-rise text-center text-xl leading-7">Ask me anything about your portfolio</h2>

      <Composer value={draft} onChange={setDraft} onSubmit={send} autoFocus className="mt-8 w-full animate-rise" />

      <div className="mt-6 flex w-full animate-rise flex-col gap-2">
        <span className="text-xs leading-5 text-muted-foreground">Suggestions</span>
        <Suggestions items={SUGGESTIONS} onPick={setDraft} layout="list" />
      </div>
    </div>
  )
}
