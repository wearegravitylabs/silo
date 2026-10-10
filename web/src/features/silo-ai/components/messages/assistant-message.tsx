import { CircleAlertIcon, RotateCcwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSiloAiChat } from '../../store'
import type { AssistantMessage as Message } from '../../types'
import { AiAvatar } from '../shared/ai-avatar'
import { AssetCard } from './asset-card'
import { ReplyLink } from './reply-link'
import { RichText } from '../shared/rich-text'
import { ShimmerLines, WorkingStatus } from './working-status'

/** Silo AI's reply: while working, the status label + shimmer bars; then the text streams in with a caret. */
export function AssistantMessage({ message }: { message: Message }) {
  const { status, label, steps, placeholder, text, attachment, link, error } = message
  const retry = useSiloAiChat((s) => s.retry)
  const working = status === 'working'

  return (
    <div className="flex animate-rise flex-col gap-3">
      <div className="flex items-center gap-2">
        <AiAvatar className="size-7" />
        {working ? (
          <WorkingStatus label={label} steps={steps} />
        ) : (
          <span className="text-xs leading-5 font-medium text-foreground">Silo AI</span>
        )}
      </div>

      {working ? (
        placeholder && <ShimmerLines />
      ) : (
        <div className="flex min-w-0 flex-col gap-4 leading-5.5 wrap-break-word text-foreground" aria-live="polite">
          {text && (
            <RichText
              text={text}
              trailing={
                status === 'streaming' && (
                  <span aria-hidden className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-caret bg-foreground" />
                )
              }
            />
          )}
          {status === 'done' && attachment && <AssetCard asset={attachment} />}
          {status === 'done' && link && <ReplyLink link={link} />}
          {status === 'stopped' && <p className="text-xs leading-5 text-subtle">You stopped this response.</p>}
          {status === 'error' && (
            <div role="alert" className="flex animate-rise flex-col gap-2.5 rounded-xl bg-destructive-subtle px-3 py-2.5">
              <p className="flex items-start gap-2 text-xs leading-5 text-destructive">
                <CircleAlertIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {error}
              </p>
              <Button variant="secondary" size="xs" onClick={() => retry(message.id)} className="w-fit gap-1 shadow-small">
                <RotateCcwIcon className="size-3" aria-hidden />
                Retry
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
