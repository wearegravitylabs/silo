import { useId, useState } from 'react'
import { LockKeyholeIcon } from 'lucide-react'
import { FormField } from '@/components/form-field'
import { PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { useUnlockVault } from '../queries'

/** Lock screen shown until the vault password is re-entered this session. */
export function VaultUnlock({ portfolioId }: { portfolioId: string }) {
  const [password, setPassword] = useState('')
  const unlock = useUnlockVault(portfolioId)
  const fieldId = useId()

  return (
    <div className="flex min-h-0 flex-1 animate-fade-in-up flex-col items-center overflow-y-auto px-4 pt-30 pb-10">
      <form
        className="flex w-full max-w-100 flex-col gap-8"
        onSubmit={(e) => {
          e.preventDefault()
          if (password) unlock.mutate(password)
        }}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-full border border-sky bg-sky-subtle text-primary-dark">
            <LockKeyholeIcon className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-3">
            <h1 className="text-xl leading-8">Secure Vault</h1>
            <p>Accessing vault requires you to re-enter your password</p>
          </div>
        </div>

        <FormField label="Password" htmlFor={fieldId} error={unlock.error?.message}>
          <PasswordInput
            id={fieldId}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              unlock.reset()
            }}
            placeholder="•••••••••••"
            autoComplete="current-password"
            invalid={unlock.isError}
            autoFocus
          />
        </FormField>

        <Button type="submit" className="w-full" disabled={!password} loading={unlock.isPending} loadingText="Unlocking…">
          Continue
        </Button>
      </form>
    </div>
  )
}
