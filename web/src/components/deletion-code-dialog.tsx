import { useId, useState, type ReactNode } from 'react'
import { FieldError } from '@/components/field-error'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Input } from '@/components/ui/input'

/**
 * Last step of a permanent deletion (account, portfolio): the code emailed to `email` plus an acknowledgement unlock
 * the red button, which hands the code to `onConfirm`. Reopens empty.
 */
export function DeletionCodeDialog({
  open,
  onOpenChange,
  title,
  warning,
  email,
  acknowledgement,
  confirmLabel,
  pending,
  invalid,
  onConfirm,
  onReset,
  codeLength = 6,
  size = 'md',
  position = 'default',
  descriptionClassName,
  defaultCode = '',
  defaultAcknowledged = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  warning: ReactNode
  email: string
  /** "I acknowledge that all of my account data will be deleted and want to proceed." */
  acknowledgement: string
  confirmLabel: string
  pending?: boolean
  /** The last code was rejected */
  invalid?: boolean
  onConfirm: (code: string) => void
  /** Clear the last attempt's error (typing a new code, closing) */
  onReset?: () => void
  codeLength?: number
  size?: 'sm' | 'md'
  /** `high`: 48px from the top instead of 104px */
  position?: 'default' | 'high'
  /** e.g. larger warning text ("text-sm leading-5.5") */
  descriptionClassName?: string
  /** Dev gallery: open with a code typed / the box ticked. */
  defaultCode?: string
  defaultAcknowledged?: boolean
}) {
  const [code, setCode] = useState(defaultCode)
  const [acknowledged, setAcknowledged] = useState(defaultAcknowledged)
  const codeId = useId()
  const ackId = useId()
  const ready = code.length === codeLength && acknowledged

  const reset = () => {
    setCode('')
    setAcknowledged(false)
    onReset?.()
  }

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (ready && !pending) onConfirm(code)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size={size} position={position} role="alertdialog" onCloseAutoFocus={reset}>
        <DialogHeader>
          <DialogTitle className="font-sans">{title}</DialogTitle>
        </DialogHeader>
        <form className="contents" onSubmit={submit} noValidate>
          <DialogBody className="flex flex-col gap-4">
            <DialogDescription className={descriptionClassName}>{warning}</DialogDescription>

            <div className="flex flex-col gap-2">
              <label htmlFor={codeId} className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-medium">
                Enter deletion code sent to
                <span className="max-w-full truncate rounded-md border border-line bg-accent px-1.5 text-xs leading-5 font-medium">
                  {email}
                </span>
              </label>
              <Input
                id={codeId}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, codeLength))
                  onReset?.()
                }}
                placeholder="Enter deletion code"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-invalid={invalid || undefined}
                autoFocus
              />
              {invalid && <FieldError message="That code didn’t work. Check your email and try again." />}
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id={ackId} checked={acknowledged} onCheckedChange={(c) => setAcknowledged(c === true)} className="mt-0.75" />
              <label htmlFor={ackId} className="leading-5.5">
                {acknowledgement}
              </label>
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" size="xs">
                Close
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" size="xs" disabled={!ready} loading={pending} loadingText="Deleting…">
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
