import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/components/settings-page'

// Not designed yet: the header only, so the settings nav is complete.
export const Route = createFileRoute('/settings/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  return <SettingsPage title="Notifications" description="Choose what you hear about and where" />
}
