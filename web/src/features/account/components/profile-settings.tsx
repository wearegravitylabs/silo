import { useState } from 'react'
import { DangerZone, DangerZoneItem } from '@/components/danger-zone'
import { Button } from '@/components/ui/button'
import { UnsavedChangesBar } from '@/components/unsaved-changes-bar'
import { DELETE_ACCOUNT_WARNING } from '../constants'
import type { User } from '../types'
import { DeleteAccountDialog } from './delete-account-dialog'
import { ProfileFields } from './profile-fields'
import { ProfilePhoto } from './profile-photo'
import { useProfileDraft } from './use-profile-draft'

/**
 * Body of Settings → Profile (inside <SettingsPage>): photo, details, Danger Zone, and the unsaved-changes bar
 * while the details differ from what's saved.
 */
export function ProfileSettings({ user }: { user: User }) {
  const { draft, errors, change, save, discard, dirty, saving } = useProfileDraft(user)
  const [deleting, setDeleting] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-4">
        <ProfilePhoto user={user} />
        <ProfileFields email={user.email} draft={draft} errors={errors} onChange={change} onSubmit={save} />
      </div>

      <DangerZone className="mt-10 mb-10">
        <DangerZoneItem
          title="Delete Account"
          description={DELETE_ACCOUNT_WARNING}
          action={
            <Button variant="destructive-subtle" size="xs" onClick={() => setDeleting(true)}>
              Delete Account
            </Button>
          }
        />
      </DangerZone>
      <DeleteAccountDialog open={deleting} onOpenChange={setDeleting} />

      <UnsavedChangesBar open={dirty} saving={saving} onSave={save} onDiscard={discard} />
    </>
  )
}
