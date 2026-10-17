import { useState } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DotsIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Scenario } from '../types'
import { EditScenarioDialog } from './edit-scenario-dialog'

/**
 * Scenario strip under the chart: value at the horizon over the name, underlined in the scenario's colour (faded when
 * not selected). ⋯ edits or deletes (after confirming); ⊕ adds. The last scenario can't be deleted.
 */
export function ScenarioTabs({
  scenarios,
  values,
  activeId,
  onSelect,
  onEdit,
  onDelete,
  deleting,
}: {
  scenarios: Scenario[]
  /** Formatted value per scenario id */
  values: Record<string, string>
  activeId: string
  onSelect: (id: string) => void
  onEdit: (id: string, patch: { name: string; color: string }) => void
  onDelete: (id: string, done: () => void) => void
  deleting?: boolean
}) {
  const [editing, setEditing] = useState<Scenario | null>(null)
  const [confirming, setConfirming] = useState<Scenario | null>(null)

  return (
    <div className="flex shrink-0 items-center gap-3.5 overflow-x-auto border-b border-border px-4 pt-3 md:px-10">
      <div role="tablist" aria-label="Scenarios" className="flex items-end gap-3.5">
        {scenarios.map((s) => {
          const active = s.id === activeId
          return (
            <div key={s.id} className="relative flex items-center gap-4 pb-3">
              <button
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(s.id)}
                className="flex flex-col items-start gap-1 rounded-sm text-left whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <span className={active ? 'text-foreground' : 'text-muted-foreground'}>{values[s.id]}</span>
                <span className={cn('text-xs leading-4', active ? 'text-muted-foreground' : 'text-subtle')}>{s.name}</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-xs" aria-label={`${s.name} options`}>
                    <DotsIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuItem onSelect={() => setEditing(s)}>
                    <PencilIcon className="size-4" />
                    Edit Scenario
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={scenarios.length === 1} onSelect={() => setConfirming(s)}>
                    <Trash2Icon className="size-4" />
                    Delete Scenario
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <span
                aria-hidden
                style={{ background: s.color }}
                className={cn('absolute inset-x-0 -bottom-px h-0.5', !active && 'opacity-50')}
              />
            </div>
          )
        })}
      </div>
      {/* TODO: Create New Scenario isn't designed yet. */}
      <button
        type="button"
        aria-label="New scenario"
        className="mb-3 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <svg viewBox="0 0 14 14" fill="none" aria-hidden className="size-3.5">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 4.5v5M4.5 7h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {editing && (
        <EditScenarioDialog
          scenario={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSave={(patch) => {
            onEdit(editing.id, patch)
            setEditing(null)
          }}
        />
      )}
      <ConfirmDialog
        open={!!confirming}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Delete Scenario"
        cancelLabel="Close"
        confirmLabel="Delete Scenario"
        pending={deleting}
        onConfirm={() => confirming && onDelete(confirming.id, () => setConfirming(null))}
      >
        You’re about to delete “{confirming?.name}” scenario. This action cannot be undone
      </ConfirmDialog>
    </div>
  )
}
