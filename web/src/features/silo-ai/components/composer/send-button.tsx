import { ArrowUpIcon, SendIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The composer's action. Idle: grey and disabled while empty (an arrow on the welcome screen, a paper
 * plane in a conversation — as in the design), brand blue ↑ once there's text. Busy: a Stop button.
 */
export function SendButton({
  ready,
  busy,
  onStop,
  emptyIcon = 'arrow',
}: {
  ready: boolean
  busy: boolean
  onStop: () => void
  emptyIcon?: 'arrow' | 'plane'
}) {
  if (busy) {
    return (
      <span className="group relative">
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop generating"
          className="flex size-8 animate-rise items-center justify-center rounded-lg bg-background shadow-small transition-transform active:scale-95"
        >
          <span className="flex size-3.5 items-center justify-center rounded-full border-[1.5px] border-destructive">
            <span className="size-1.5 rounded-full bg-destructive" />
          </span>
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute right-0 bottom-full mb-2 rounded-md bg-ink px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          Stop Generating
        </span>
      </span>
    )
  }

  const Icon = ready || emptyIcon === 'arrow' ? ArrowUpIcon : SendIcon
  return (
    <button
      type="submit"
      disabled={!ready}
      aria-label="Send message"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg transition-[background-color,color,transform] duration-150',
        ready ? 'bg-gradient-primary text-primary-foreground active:scale-95' : 'bg-accent text-subtle',
      )}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  )
}
