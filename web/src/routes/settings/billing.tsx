import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/components/settings-page'

// Not designed yet: the header only, so the settings nav is complete.
export const Route = createFileRoute('/settings/billing')({
  component: BillingPage,
})

function BillingPage() {
  return <SettingsPage title="Billing" description="Manage your plan and payment details" />
}
