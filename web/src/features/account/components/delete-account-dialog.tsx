import { useId, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
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
import { DELETE_ACCOUNT_WARNING, DELETION_CODE_LENGTH } from '../constants'
import { useDeleteAccount } from '../queries'

/**
 * Final step of account deletion: the code emailed to `email` plus an acknowledgement unlock Delete Account.
 * Success signs out to /login. Reopens empty.
 */
export function DeleteAccountDialog({
  open,
  onOpenChange,
  email,
  defaultCode = '',
  defaultAcknowledged = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  /** Dev gallery: open with a code typed / the box ticked. */
  defaultCode?: string
  defaultAcknowledged?: boolean
}) {
  const [code, setCode] = useState(defaultCode)
  const [acknowledged, setAcknowledged] = useState(defaultAcknowledged)
  const remove = useDeleteAccount()
  const navigate = useNavigate()
  const codeId = useId()
  const ackId = useId()
  const ready = code.length === DELETION_CODE_LENGTH && acknowledged

  const reset = () => {
    setCode('')
    setAcknowledged(false)
    remove.reset()
  }

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!ready || remove.isPending) return
    remove.mutate(code, {
      onSuccess: () => {
        toast.success('Your account has been deleted')
        navigate({ to: '/login' })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" role="alertdialog" onCloseAutoFocus={reset}>
        <DialogHeader>
          <DialogTitle className="font-sans">Verify Account Deletion</DialogTitle>
        </DialogHeader>
        <form className="contents" onSubmit={submit} noValidate>
          <DialogBody className="flex flex-col gap-4">
            <DialogDescription>{DELETE_ACCOUNT_WARNING}</DialogDescription>

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
                  setCode(e.target.value.replace(/\D/g, '').slice(0, DELETION_CODE_LENGTH))
                  remove.reset()
                }}
                placeholder="Enter deletion code"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-invalid={remove.isError || undefined}
                autoFocus
              />
              {remove.isError && <FieldError message="That code didn’t work. Check your email and try again." />}
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id={ackId} checked={acknowledged} onCheckedChange={(c) => setAcknowledged(c === true)} className="mt-0.75" />
              <label htmlFor={ackId} className="leading-5.5">
                I acknowledge that all of my account data will be deleted and want to proceed.
              </label>
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" size="xs">
                Close
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" size="xs" disabled={!ready} loading={remove.isPending} loadingText="Deleting…">
              Delete Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
