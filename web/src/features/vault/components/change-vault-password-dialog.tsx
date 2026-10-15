import { useId, useState, type ReactNode } from 'react'
import { InfoIcon } from 'lucide-react'
import { toast } from 'sonner'
import { FieldError } from '@/components/field-error'
import { FormField } from '@/components/form-field'
import { OtpInput } from '@/components/otp-input'
import { PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MIN_PASSWORD_LENGTH } from '../constants'
import { useVaultPasswordChange } from '../queries'

const CODE_LENGTH = 6

/** intro: we'll email you → code: enter what we sent → password: choose the new one. */
export type ChangeVaultPasswordStep = 'intro' | 'code' | 'password'

/**
 * Change Vault Password, after proving it's you: send a link + code to `email`, check the code, set the new
 * password. Reopens on the first step.
 */
export function ChangeVaultPasswordDialog({
  portfolioId,
  email,
  open,
  onOpenChange,
  defaultStep = 'intro',
  defaultCode = '',
  defaultCodeError,
  defaultPassword = '',
}: {
  portfolioId: string
  email: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Dev gallery: open part-way through. */
  defaultStep?: ChangeVaultPasswordStep
  defaultCode?: string
  defaultCodeError?: string
  defaultPassword?: string
}) {
  const [step, setStep] = useState<ChangeVaultPasswordStep>(defaultStep)
  const [code, setCode] = useState(defaultCode)
  const [codeError, setCodeError] = useState(defaultCodeError)
  const { request, verify, change } = useVaultPasswordChange(portfolioId)

  const reset = () => {
    setStep('intro')
    setCode('')
    setCodeError(undefined)
  }

  const sendLink = () =>
    request.mutate(undefined, {
      onSuccess: () => {
        toast.success('Verification link has been sent successfully!')
        setStep('code')
      },
      onError: () => toast.error('Couldn’t send the verification link. Try again.'),
    })

  const checkCode = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (code.length < CODE_LENGTH || verify.isPending) return
    verify.mutate(code, { onSuccess: () => setStep('password'), onError: (error) => setCodeError(error.message) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby={undefined} onCloseAutoFocus={reset}>
        <DialogHeader>
          <DialogTitle className="font-sans">Change Vault Password</DialogTitle>
        </DialogHeader>

        {step === 'intro' && (
          <>
            <DialogBody>
              <VerifyCopy email={email} />
            </DialogBody>
            <Footer>
              <Button size="xs" loading={request.isPending} loadingText="Sending…" onClick={sendLink}>
                Send Verification Link
              </Button>
            </Footer>
          </>
        )}

        {step === 'code' && (
          <form className="contents" onSubmit={checkCode}>
            <DialogBody className="flex flex-col gap-4">
              <VerifyCopy email={email} />
              <div>
                <OtpInput
                  value={code}
                  onChange={(next) => {
                    setCode(next)
                    setCodeError(undefined)
                  }}
                  length={CODE_LENGTH}
                  hasError={!!codeError}
                  className="max-[25rem]:gap-1.5 max-[25rem]:[&>input]:size-10"
                />
                {codeError && <FieldError message={codeError} />}
              </div>
            </DialogBody>
            <Footer>
              <Button type="submit" size="xs" disabled={code.length < CODE_LENGTH} loading={verify.isPending}>
                Continue
              </Button>
            </Footer>
          </form>
        )}

        {step === 'password' && (
          <NewPasswordForm
            defaultPassword={defaultPassword}
            pending={change.isPending}
            onSubmit={(password) =>
              change.mutate(
                { code, password },
                {
                  onSuccess: () => {
                    toast.success('Vault password has been changed successfully!')
                    onOpenChange(false)
                  },
                  onError: (error) => toast.error(error.message),
                },
              )
            }
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function VerifyCopy({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-2 text-xs leading-5">
      <p>For security reasons, we need to verify it’s you before we complete this action.</p>
      <p>We’ll send a verification link and code to: {email}</p>
    </div>
  )
}

/** New + confirm. Checked on submit; each field's message clears as it's edited. */
function NewPasswordForm({
  defaultPassword,
  pending,
  onSubmit,
}: {
  defaultPassword: string
  pending: boolean
  onSubmit: (password: string) => void
}) {
  const [password, setPassword] = useState(defaultPassword)
  const [confirm, setConfirm] = useState(defaultPassword && defaultPassword.length >= MIN_PASSWORD_LENGTH ? defaultPassword : '')
  // Gallery: a too-short default shows its error straight away.
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>(() =>
    defaultPassword && defaultPassword.length < MIN_PASSWORD_LENGTH ? { password: tooShort } : {},
  )
  const id = useId()

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const found = {
      password: password.length < MIN_PASSWORD_LENGTH ? tooShort : undefined,
      confirm: !confirm ? 'Confirm your new password' : confirm !== password ? 'Passwords don’t match' : undefined,
    }
    setErrors(found)
    if (!found.password && !found.confirm && !pending) onSubmit(password)
  }

  return (
    <form className="contents" onSubmit={submit} noValidate>
      <DialogBody className="flex flex-col gap-4">
        <FormField
          label="New Password"
          htmlFor={`${id}-new`}
          error={errors.password}
          hint={
            <p className="flex items-center gap-1.5 text-xs leading-5">
              <InfoIcon className="size-3 shrink-0 fill-subtle text-background" aria-hidden />
              {tooShort}
            </p>
          }
        >
          <PasswordInput
            id={`${id}-new`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrors((v) => ({ ...v, password: undefined }))
            }}
            invalid={!!errors.password}
            placeholder="•••••••••••"
            autoComplete="new-password"
            autoFocus
          />
        </FormField>
        <FormField label="Confirm Password" htmlFor={`${id}-confirm`} error={errors.confirm}>
          <PasswordInput
            id={`${id}-confirm`}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
              setErrors((v) => ({ ...v, confirm: undefined }))
            }}
            invalid={!!errors.confirm}
            placeholder="•••••••••••"
            autoComplete="new-password"
          />
        </FormField>
      </DialogBody>
      <Footer>
        <Button type="submit" size="xs" loading={pending} loadingText="Changing…">
          Change Password
        </Button>
      </Footer>
    </form>
  )
}

const tooShort = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`

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
