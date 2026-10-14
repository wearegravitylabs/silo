import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** Destructive confirmation: title, a short warning, Cancel + a red confirm button that shows progress while `pending`. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  confirmLabel,
  pendingLabel = 'Deleting…',
  cancelLabel = 'Cancel',
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** The warning text */
  children: ReactNode
  confirmLabel: string
  pendingLabel?: string
  cancelLabel?: string
  pending?: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="alertdialog">
        <DialogHeader>
          <DialogTitle className="font-sans">{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>{children}</DialogDescription>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="xs">
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button variant="destructive" size="xs" loading={pending} loadingText={pendingLabel} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
