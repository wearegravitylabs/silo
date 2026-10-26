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

/**
 * Confirmation: title, a short warning, Cancel + a confirm button that shows progress while `pending` — red by
 * default, blue with `tone="primary"` for steps that aren't destructive (pause, resume).
 */
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
  size,
  position,
  descriptionClassName,
  tone = 'destructive',
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
  /** Dialog width (default md, 426px) */
  size?: 'sm' | 'md'
  /** `high`: 48px from the top instead of 104px */
  position?: 'default' | 'high'
  /** e.g. larger body text ("text-sm leading-5.5") */
  descriptionClassName?: string
  tone?: 'destructive' | 'primary'
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="alertdialog" size={size} position={position}>
        <DialogHeader>
          <DialogTitle className="font-sans">{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription className={descriptionClassName}>{children}</DialogDescription>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="xs">
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button variant={tone} size="xs" loading={pending} loadingText={pendingLabel} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
