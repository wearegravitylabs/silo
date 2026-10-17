import type { ReactNode } from 'react'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Selectable card in a single-choice list (use inside a role="radiogroup"): icon, label, optional description,
 * ✓ and a brand border when selected. `sm` is a 52px row that puts the icon on a small tinted disc; `md` a 70px row
 * whose icon is a 40px avatar the caller draws (asset logo, debt disc).
 */
export function ChoiceCard({
  label,
  description,
  icon,
  selected,
  onSelect,
  size = 'md',
}: {
  label: string
  description?: string
  icon?: ReactNode
  selected: boolean
  onSelect: () => void
  size?: 'sm' | 'md'
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full shrink-0 items-center gap-3 rounded-xl border bg-background p-3 text-left transition-colors outline-none',
        'hover:border-primary-dark/40 focus-visible:ring-2 focus-visible:ring-ring/40',
        selected ? 'border-primary-dark' : 'border-border',
        size === 'sm' ? 'h-13' : 'min-h-17.5',
      )}
    >
      {icon &&
        (size === 'sm' ? (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle">{icon}</span>
        ) : (
          icon
        ))}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-medium text-foreground">{label}</span>
        {description && <span className="truncate text-xs leading-4 text-muted-foreground">{description}</span>}
      </span>
      {selected && <CheckIcon className="size-4 shrink-0 text-primary-dark" aria-hidden />}
    </button>
  )
}
