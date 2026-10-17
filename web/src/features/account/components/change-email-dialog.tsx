import { useId, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { isEmail } from '@/lib/validation'
import { useCheckEmail, useRequestEmailChange } from '../queries'

/** enter: type the new address → available: no account uses it, send the link | exists: it's taken, try another. */
export type ChangeEmailView = 'enter' | 'available' | 'exists'

/**
 * Change the account email: check the new address isn't tied to another account, then email it a verification
 * link. Reopens on an empty first step.
 */
export function ChangeEmailDialog({
  open,
  onOpenChange,
  currentEmail,
  defaultView = 'enter',
  defaultEmail = '',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEmail: string
  /** Dev gallery: open on a later step / with an address typed. */
  defaultView?: ChangeEmailView
  defaultEmail?: string
}) {
  const [view, setView] = useState<ChangeEmailView>(defaultView)
  const [email, setEmail] = useState(defaultEmail)
  const [error, setError] = useState<string>()
  const check = useCheckEmail()
  const send = useRequestEmailChange()
  const fieldId = useId()

  const reset = () => {
    setView('enter')
    setEmail('')
    setError(undefined)
  }

  const submitCheck = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const next = email.trim()
    if (!isEmail(next)) return setError('Enter a valid email address')
    if (next.toLowerCase() === currentEmail.toLowerCase()) return setError('This is already your email address')
    check.mutate(next, {
      onSuccess: ({ exists }) => setView(exists ? 'exists' : 'available'),
      onError: () => setError('Couldn’t check that email. Try again.'),
    })
  }

  const sendLink = () =>
    send.mutate(email.trim(), {
      onSuccess: () => {
        toast.success(`Verification link sent to ${email.trim()}`)
        onOpenChange(false)
      },
      onError: () => toast.error('Couldn’t send the verification link. Try again.'),
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby={undefined} onCloseAutoFocus={reset}>
        <DialogHeader>
          <DialogTitle className="font-sans">{view === 'exists' ? 'Existing Account Found' : 'Change Email'}</DialogTitle>
        </DialogHeader>

        {view === 'enter' && (
          <form className="contents" onSubmit={submitCheck} noValidate>
            <DialogBody className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 text-xs leading-5">
                <p>
                  If you’d like to change the email address for your account, we’ll send a verification link to your new email address. This
                  change will apply across all portfolios that you’re a partner of.
                </p>
                <p>Please check if the new email address is tied to an existing account before proceeding with the change</p>
              </div>
              <FormField label="Enter the new email address you’d like to use." htmlFor={fieldId} error={error}>
                <Input
                  id={fieldId}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(undefined)
                  }}
                  placeholder="New email address"
                  autoComplete="email"
                  aria-invalid={!!error || undefined}
                  autoFocus
                />
              </FormField>
            </DialogBody>
            <Footer>
              <Button type="submit" size="xs" loading={check.isPending} loadingText="Checking…">
                Check Email
              </Button>
            </Footer>
          </form>
        )}

        {view === 'available' && (
          <>
            <DialogBody>
              <p className="text-xs leading-5">
                We did not find an existing account for {email.trim()}. You can safely proceed with the email change
              </p>
            </DialogBody>
            <Footer>
              <Button size="xs" loading={send.isPending} loadingText="Sending…" onClick={sendLink}>
                Send Verification Link
              </Button>
            </Footer>
          </>
        )}

        {view === 'exists' && (
          <>
            <DialogBody className="flex flex-col gap-2 text-xs leading-5">
              <p>
                We found an existing account for {email.trim()}. You cannot change your email address to one matching an existing account.
              </p>
              <p>Please try with a different email address, or change the email address on that account first</p>
            </DialogBody>
            <Footer>
              <Button size="xs" onClick={() => setView('enter')}>
                Change Email
              </Button>
            </Footer>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Close + the step's primary action. */
function Footer({ children }: { children: ReactNode }) {
  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="secondary" size="xs">
          Close
        </Button>
      </DialogClose>
      {children}
    </DialogFooter>
  )
}
