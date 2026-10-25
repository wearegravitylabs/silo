import type { ReactNode } from 'react'
import type { AssetItem } from '../../types'
import { ProgressLine } from '@/components/progress-line'
import { Button } from '@/components/ui/button'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'

// The Create Asset sheet's frame, shared by every flow: title + progress line, a step body, the footer.

export function SheetHeader({ progress }: { progress: number }) {
  return (
    <div className="flex shrink-0 flex-col">
      <DialogHeader className="border-b-0 px-4 md:px-5">
        <DialogTitle>Create Asset</DialogTitle>
      </DialogHeader>
      <ProgressLine value={progress} label="Create Asset progress" />
    </div>
  )
}

/** Scrolling, centred body for the single-column steps (type, search, a kind list). */
export function StepBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 justify-center overflow-y-auto px-4 pt-10 pb-8 md:pt-14">{children}</div>
}

/** Close/Back on the left; Continue on the right when the step has one. */
export function SheetFooter({
  back,
  next,
}: {
  back: { label: string; onClick: () => void }
  next?: { onClick: () => void; disabled: boolean }
}) {
  return (
    <div className="flex h-15 shrink-0 items-center justify-between border-t border-border px-4 md:px-5">
      <Button variant="secondary" size="xs" onClick={back.onClick} className="px-3">
        {back.label}
      </Button>
      {next && (
        <Button size="xs" onClick={next.onClick} disabled={next.disabled} className="px-3">
          Continue
        </Button>
      )}
    </div>
  )
}

/** What every flow gets from the sheet. */
export interface FlowProps {
  portfolioId: string
  folderId: string | null
  defaultCurrency: string
  onCreated?: (asset: AssetItem) => void
  onClose: () => void
  /** Back to Choose an Asset Type */
  onBack: () => void
}
