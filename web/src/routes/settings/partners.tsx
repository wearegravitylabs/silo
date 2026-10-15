import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/components/settings-page'

// Not designed yet: the header only, so the settings nav is complete.
export const Route = createFileRoute('/settings/partners')({
  component: PartnersPage,
})

function PartnersPage() {
  return <SettingsPage title="Partners" description="Manage who has access to your portfolios" />
}
