import { PauseIcon, PencilIcon, PlayIcon, Trash2Icon } from 'lucide-react'
import { EntryAction, EntryCard } from '@/components/entry-card'
import { cn } from '@/lib/utils'

/**
 * One Auto-Pilot rule (asset, debt): its dates over what it does and how often, then the signed amount (green or red)
 * and when it next runs. Pause/resume, edit and delete show for the handlers given. Paused rules are faded.
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
  /** "Next Execution: Mar 1, 2026", "Paused" */
  status: string
  active: boolean
  onToggle?: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <EntryCard
      className={cn(!active && 'opacity-60')}
      label={label}
      actions={
        (onToggle || onEdit || onDelete) && (
          <>
            {onToggle && (
              <EntryAction label={active ? 'Pause rule' : 'Resume rule'} onClick={onToggle}>
                {active ? <PauseIcon className="size-3.5" /> : <PlayIcon className="size-3.5" />}
              </EntryAction>
            )}
            {onEdit && (
              <EntryAction label="Edit rule" onClick={onEdit}>
                <PencilIcon className="size-3.5" />
              </EntryAction>
            )}
            {onDelete && (
              <EntryAction label="Delete rule" tone="danger" onClick={onDelete}>
                <Trash2Icon className="size-3.5" />
              </EntryAction>
            )}
          </>
        )
      }
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-foreground">{frequency}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-xs leading-5">
        <span className={tone === 'positive' ? 'text-success' : 'text-destructive'}>{amount}</span>
        <span className="truncate text-muted-foreground">{status}</span>
      </div>
    </EntryCard>
  )
}
