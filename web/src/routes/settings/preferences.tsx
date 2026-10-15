import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/components/settings-page'

// Not designed yet: the header only, so the settings nav is complete.
export const Route = createFileRoute('/settings/preferences')({
  component: PreferencesPage,
})

function PreferencesPage() {
  return <SettingsPage title="Preferences" description="Manage how Silo looks and behaves for you" />
}
