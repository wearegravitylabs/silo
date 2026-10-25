import * as React from 'react'
import { cn } from '@/lib/utils'
import { DialogContent } from './dialog'

const SIDES = {
  /** Full-width sheet rising from the bottom, up to 904px tall (Add Asset, Add Debt). */
  bottom:
    'top-auto bottom-0 h-[min(904px,calc(100dvh-24px))] max-h-none w-full max-w-none animate-sheet-up rounded-t-2xl rounded-b-none shadow-none',
  /** Full-height panel from the right edge, 600px wide (full width on phones): detail panels. */
  right: 'top-0 right-0 left-auto h-dvh max-h-none w-full max-w-150 translate-x-0 animate-slide-in-right rounded-none shadow-sheet',
}

/**
 * Dialog that docks to a screen edge instead of floating in the middle. Put it inside a <Dialog> like
 * DialogContent; the page behind is dimmed.
 */
function SheetContent({
  side = 'bottom',
  className,
  overlayClassName,
  ...props
}: React.ComponentProps<typeof DialogContent> & { side?: keyof typeof SIDES }) {
  return <DialogContent overlayClassName={cn('bg-ink/60', overlayClassName)} className={cn(SIDES[side], className)} {...props} />
}

export { SheetContent }
