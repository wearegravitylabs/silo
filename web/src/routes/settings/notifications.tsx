import { createFileRoute } from '@tanstack/react-router'
import { NotificationSettings } from '@/features/account'
import { SettingsPage } from '@/components/settings-page'

export const Route = createFileRoute('/settings/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  return (
    <SettingsPage title="Notifications" description="Manage how you receive notifications">
      <NotificationSettings />
    </SettingsPage>
  )
}
