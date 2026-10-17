import { createFileRoute } from '@tanstack/react-router'
import { ProfileSettings, useMe } from '@/features/account'
import { SettingsPage } from '@/components/settings-page'

export const Route = createFileRoute('/settings/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: me } = useMe()
  return (
    <SettingsPage title="Profile" description="Manage your personal information">
      {me && <ProfileSettings user={me} />}
    </SettingsPage>
  )
}
