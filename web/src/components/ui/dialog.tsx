import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronLeftIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { CloseIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { usePreviewMode } from './preview-mode'

/** Modal dialog root. Non-modal inside <PreviewMode> (dev galleries). */
function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const preview = usePreviewMode()
  return <DialogPrimitive.Root modal={!preview} {...props} />
}
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close

/**
 * Every modal's size and placement, in one place. Pick a variant instead of one-off classes so modals
 * stay uniform; restyle them all here.
 */
const dialogContentVariants = cva(
  [
    'fixed left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col',
    'animate-rise overflow-hidden rounded-2xl bg-background text-foreground shadow-elevated outline-none',
  ],
  {
    variants: {
      size: {
        sm: 'w-100', // 400px: Share, Manage/Revoke access
        md: 'w-106.5', // 426px: forms, command palette
        lg: 'w-226', // 904px: two-column (Upgrade)
      },
      position: {
        default: 'top-26 max-h-[calc(100dvh-8rem)]', // 104px from the top
        high: 'top-12 max-h-[calc(100dvh-4rem)]', // 48px: dialogs that grow downwards
        top: 'top-2.5 max-h-[calc(100dvh-1.25rem)]', // 10px: command palette
      },
    },
    defaultVariants: { size: 'md', position: 'default' },
  },
)

function DialogContent({
  className,
  overlayClassName,
  size,
  position,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & VariantProps<typeof dialogContentVariants> & { overlayClassName?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={cn('fixed inset-0 z-50 bg-ink/40 data-open:animate-in data-open:fade-in-0', overlayClassName)} />
      <DialogPrimitive.Content className={cn(dialogContentVariants({ size, position }), className)} {...props}>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/** 54px title bar. `onBack` adds a ‹ back button before the title (sub-views); `closable={false}` hides ✕. */
function DialogHeader({
  className,
  children,
  onBack,
  closable = true,
  ...props
}: React.ComponentProps<'div'> & { onBack?: () => void; closable?: boolean }) {
  return (
    <div className={cn('flex h-13.5 shrink-0 items-center justify-between gap-3 border-b px-5', className)} {...props}>
      <div className="flex min-w-0 items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="-ml-1.5 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <ChevronLeftIcon className="size-4" />
          </button>
        )}
        {children}
      </div>
      {closable && (
        <DialogClose
          aria-label="Close"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <CloseIcon />
        </DialogClose>
      )}
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
