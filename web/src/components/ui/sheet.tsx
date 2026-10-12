import * as React from 'react'
import { cn } from '@/lib/utils'
import { DialogContent } from './dialog'

/**
 * Full-height bottom sheet (Add Asset, Add Debt): a dialog that rises from the bottom edge, full width,
 * rounded top corners only, up to 904px tall. Put it inside a <Dialog> like DialogContent.
 */
function SheetContent({ className, overlayClassName, ...props }: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      overlayClassName={cn('bg-ink/60', overlayClassName)}
      className={cn(
        'top-auto bottom-0 h-[min(904px,calc(100dvh-24px))] max-h-none w-full max-w-none animate-sheet-up rounded-t-2xl rounded-b-none shadow-none',
        className,
      )}
      {...props}
    />
  )
}

export { SheetContent }
