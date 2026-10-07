import * as React from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { CloseIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close

/**
 * Modal card. Defaults to Silo's standard: 426px wide, 104px from the top.
 * Override placement/size with className (e.g. a centred confirm, a full-height sheet).
 */
function DialogContent({
  className,
  overlayClassName,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { overlayClassName?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={cn('fixed inset-0 z-50 bg-ink/40 data-open:animate-in data-open:fade-in-0', overlayClassName)} />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-26 left-1/2 z-50 flex max-h-[calc(100dvh-8rem)] w-106.5 max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col',
          'animate-rise overflow-hidden rounded-2xl bg-background text-foreground shadow-elevated outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/** 54px title bar with a close button. */
function DialogHeader({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex h-13.5 shrink-0 items-center justify-between border-b px-5', className)} {...props}>
      {children}
      <DialogClose
        aria-label="Close"
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        <CloseIcon />
      </DialogClose>
    </div>
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('font-medium', className)} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('text-xs leading-5 text-muted-foreground', className)} {...props} />
}

function DialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('min-h-0 overflow-y-auto px-5 py-4', className)} {...props} />
}

/** 60px action bar, right-aligned. */
function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex h-15 shrink-0 items-center justify-end gap-2 border-t px-5', className)} {...props} />
}

export { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger }
