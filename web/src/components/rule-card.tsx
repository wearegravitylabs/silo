import { CirclePauseIcon, PauseIcon, PencilIcon, PlayIcon, Trash2Icon } from 'lucide-react'
import { EntryCard } from '@/components/entry-card'
import { DotsIcon } from '@/components/icons'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/**
 * One Auto-Pilot rule (asset, debt): its dates and a ⋯ menu (pause or resume, edit, delete — those with a handler)
 * over what it does and how often, then the signed amount (green or red) and when it next runs. A paused rule shows
 * a "Paused" badge, a grey amount and no next run.
 */
export function RuleCard({
  label,
  title,
  frequency,
  amount,
  tone,
  status,
  active,
  onToggle,
  onEdit,
  onDelete,
}: {
  /** "FEB 28, 2026 - APR 28, 2026" */
  label: string
  /** "Add", "Remove", "Payment" */
  title: string
  /** "Daily" */
  frequency: string
  /** "+100 $MSFT" */
  amount: string
  tone: 'positive' | 'negative'
  /** "Next Execution: Mar 1, 2026"; ignored while paused */
  status: string
  active: boolean
  onToggle?: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const hasMenu = onToggle || onEdit || onDelete
  return (
    <EntryCard
      label={label}
      actions={
        hasMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`${title} rule options`}
              className="flex size-5 items-center justify-center rounded-sm outline-none hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 aria-expanded:text-foreground"
            >
              <DotsIcon className="text-current" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onToggle && (
                <DropdownMenuItem onSelect={onToggle}>
                  {active ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
                  {active ? 'Pause Rule' : 'Resume Rule'}
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onSelect={onEdit}>
                  <PencilIcon className="size-4" />
                  Edit Rule
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onSelect={onDelete}>
                  <Trash2Icon className="size-4" />
                  Delete Rule
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    >
      <div className="flex items-center justify-between gap-4">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-medium text-foreground">{title}</span>
          {!active && (
            <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-md border-[0.5px] border-line bg-accent px-1.5 text-xs text-foreground">
              <CirclePauseIcon className="size-3 text-muted-foreground" aria-hidden />
              Paused
            </span>
          )}
        </span>
        <span className="text-foreground">{frequency}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-xs leading-5">
        <span className={cn(!active ? 'text-muted-foreground' : tone === 'positive' ? 'text-success' : 'text-destructive')}>{amount}</span>
        <span className="truncate text-muted-foreground">{active ? status : '--'}</span>
      </div>
    </EntryCard>
  )
}
