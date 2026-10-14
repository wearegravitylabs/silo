import { useId, useState, type ReactNode } from 'react'
import { CircleCheckIcon, InfoIcon } from 'lucide-react'
import { toast } from 'sonner'
import { FileTypeIcon } from '@/components/file-type-icon'
import { FormField } from '@/components/form-field'
import { PasswordInput } from '@/components/password-input'
import { BannerStep, StepDialog } from '@/components/step-dialog'
import { cn } from '@/lib/utils'
import { MIN_PASSWORD_LENGTH } from '../constants'
import { useCreateVaultPassword } from '../queries'

/** First visit: what the vault is, then create its password. Success closes it with a toast. */
export function VaultSetupDialog({
  portfolioId,
  open,
  onOpenChange,
  defaultStep,
}: {
  portfolioId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Step to open on (dev gallery). */
  defaultStep?: number
}) {
  const [password, setPassword] = useState('')
  const create = useCreateVaultPassword(portfolioId)
  const fieldId = useId()
  const valid = password.length >= MIN_PASSWORD_LENGTH

  const submit = () => {
    if (!valid || create.isPending) return
    create.mutate(password, {
      onSuccess: () => {
        toast.success('Password has been created successfully!')
        onOpenChange(false)
        setPassword('')
      },
    })
  }

  return (
    <StepDialog
      open={open}
      onOpenChange={onOpenChange}
      defaultStep={defaultStep}
      steps={[
        {
          title: 'Secure Vault',
          content: (
            <BannerStep banner={<Illustration />}>
              Separate, extra-encrypted storage area for highly sensitive documents requiring additional authentication.
            </BannerStep>
          ),
          action: { label: 'Get Started' },
        },
        {
          title: 'Create Vault Password',
          content: (
            <form
              className="flex flex-col gap-5 px-5 py-4"
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <p className="text-xs leading-5">Vault password will be required every time you want to access the vault feature.</p>
              <FormField
                label="Password"
                htmlFor={fieldId}
                error={create.error?.message}
                hint={
                  <p className="flex items-center gap-1.5 text-xs leading-5">
                    <InfoIcon className="size-3 fill-subtle text-white" aria-hidden />
                    Password must be at least {MIN_PASSWORD_LENGTH} characters
                  </p>
                }
              >
                <PasswordInput
                  id={fieldId}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••••••"
                  autoComplete="new-password"
                  autoFocus
                />
              </FormField>
            </form>
          ),
          action: { label: 'Create Password', onClick: submit, disabled: !valid, loading: create.isPending },
        },
      ]}
    />
  )
}

/** Lime band: a card of two masked files, tagged "Secured" and "Encrypted". */
function Illustration() {
  return (
    <div aria-hidden className="flex size-full justify-center bg-highlight pt-6.5">
      <div className="relative h-fit w-78.5 rounded-t-2xl bg-background">
        <SampleFile fileName="file.pdf" size="3 MB" />
        <SampleFile fileName="file.docx" size="1 MB" className="border-t border-border" />
        <Tag className="top-8.75 -right-8.25" icon={<CircleCheckIcon className="size-3 fill-success text-white" />}>
          Secured
        </Tag>
        <Tag className="top-21.5 -left-8.75" icon={<SolidLock />}>
          Encrypted
        </Tag>
      </div>
    </div>
  )
}

function SampleFile({ fileName, size, className }: { fileName: string; size: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 px-4 py-4.75', className)}>
      <FileTypeIcon fileName={fileName} />
      <div className="flex flex-col gap-1">
        <span className="font-medium text-foreground">XXXXXXXXX</span>
        <span className="text-xs leading-4 text-muted-foreground">{size}</span>
      </div>
    </div>
  )
}

function Tag({ icon, className, children }: { icon: ReactNode; className: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'absolute flex h-6 items-center gap-1.5 rounded-full bg-background px-2 text-xs font-medium text-foreground shadow-elevated',
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

/** Filled padlock (lucide's lock fills its shackle too). */
function SolidLock() {
  return (
    <svg viewBox="0 0 12 12" className="size-3 text-destructive">
      <path d="M3.75 5.25V3.75a2.25 2.25 0 0 1 4.5 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="5" width="8" height="6.5" rx="1.5" fill="currentColor" />
    </svg>
  )
}
