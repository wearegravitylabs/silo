import { createFileRoute } from '@tanstack/react-router'
import { PreferencesSettings } from '@/features/preferences'
import { SettingsPage } from '@/components/settings-page'

export const Route = createFileRoute('/settings/preferences')({
  component: PreferencesPage,
})

function PreferencesPage() {
  return (
    <SettingsPage title="Preference" description="Manage how your dashboard look and feel">
      <PreferencesSettings />
    </SettingsPage>
  )
}
