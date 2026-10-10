import { AiSparkleIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/**
 * Prompt chips. `list`: stacked full-width (welcome screen). `row`: one line that scrolls sideways
 * (above the composer in a conversation).
 */
export function Suggestions({ items, onPick, layout }: { items: string[]; onPick: (text: string) => void; layout: 'list' | 'row' }) {
  return (
    <ul
      className={cn(
        'flex gap-1.5',
        layout === 'list' ? 'flex-col' : '-mx-4 [scrollbar-width:none] overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden',
      )}
    >
      {items.map((text, i) => (
        <li key={text} className="shrink-0 animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
          <button
            type="button"
            onClick={() => onPick(text)}
            className={cn(
              'flex h-8 items-center gap-2 rounded-lg bg-background px-3 text-left text-foreground shadow-small transition-colors hover:bg-surface',
              layout === 'list' && 'w-full',
            )}
          >
            <AiSparkleIcon className="size-3.5" />
            <span className="truncate">{text}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
