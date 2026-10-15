import { useId, useState } from 'react'
import { FormField } from '@/components/form-field'
import { ReadOnlyField } from '@/components/read-only-field'
import { SettingHeading } from '@/components/setting-row'
import { useVaultStatus } from '../queries'
import { ChangeVaultPasswordDialog } from './change-vault-password-dialog'
import { VaultSetupDialog } from './vault-setup-dialog'

// Stands in for the password: never sent to the browser, only its presence.
const MASK = '•••••••••••'

/**
 * Settings → Security: the vault password, hidden. The pencil changes it (verify by email first), or creates it
 * when the vault has none yet. Suspends — preload `vaultStatusQuery(portfolioId)`.
 */
export function VaultPasswordSetting({ portfolioId, email }: { portfolioId: string; email: string }) {
  const { has_password } = useVaultStatus(portfolioId)
  const [editing, setEditing] = useState(false)
  const fieldId = useId()

  return (
    <section className="flex flex-col gap-3">
      <SettingHeading title="Vault Password" description="Manage your vault password" />
      <FormField label="Password" htmlFor={fieldId}>
        <ReadOnlyField
          id={fieldId}
          type="password"
          value={has_password ? MASK : ''}
          placeholder="Not set"
          onEdit={() => setEditing(true)}
          editLabel={has_password ? 'Change vault password' : 'Create vault password'}
        />
      </FormField>
      {has_password ? (
        <ChangeVaultPasswordDialog portfolioId={portfolioId} email={email} open={editing} onOpenChange={setEditing} />
      ) : (
        <VaultSetupDialog portfolioId={portfolioId} open={editing} onOpenChange={setEditing} defaultStep={1} />
      )}
    </section>
  )
}
