import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/components/settings-page'

// Not designed yet: the header only, so the settings nav is complete.
export const Route = createFileRoute('/settings/security')({
  component: SecurityPage,
})

function SecurityPage() {
  return <SettingsPage title="Security & Access" description="Manage your sign-in methods and active sessions" />
}
