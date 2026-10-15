import { InfoIcon } from 'lucide-react'
import { CloseIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

/**
 * Dark strip pinned to the bottom of a settings form while it has unsaved edits: Save Changes, or ✕ to discard.
 * Place it last in a flex column that fills the scroll area (<SettingsPage>): it sits at the bottom and sticks while
 * the page scrolls.
 */
export function UnsavedChangesBar({
  open,
  saving,
  onSave,
  onDiscard,
}: {
  open: boolean
  saving?: boolean
  onSave: () => void
  onDiscard: () => void
}) {
  if (!open) return null
  return (
    <div
      role="status"
      className="sticky bottom-6 mt-auto flex h-12 animate-rise items-center gap-3 rounded-lg bg-foreground pr-3 pl-4 text-background shadow-elevated md:bottom-24"
    >
      <InfoIcon className="size-4 shrink-0 fill-muted-foreground text-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate font-medium">Your changes haven&apos;t been saved yet</span>
      <Button variant="secondary" size="xs" loading={saving} loadingText="Saving…" onClick={onSave}>
        Save Changes
      </Button>
      <button
        type="button"
        onClick={onDiscard}
        disabled={saving}
        aria-label="Discard changes"
        className="flex size-6 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-background/60 focus-visible:outline-none"
      >
        <CloseIcon />
      </button>
    </div>
  )
}
