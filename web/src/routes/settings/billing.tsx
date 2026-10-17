import { createFileRoute } from '@tanstack/react-router'
import { BillingSettings, invoicesQuery, resetBilling, subscriptionQuery, type BillingScenario } from '@/features/billing'
import { SettingsPage } from '@/components/settings-page'

const SCENARIOS: BillingScenario[] = ['trial', 'trial-ended', 'premium', 'renews-today', 'overdue']

export const Route = createFileRoute('/settings/billing')({
  // Dev: `?mock=premium` (etc.) starts the mock account in that state.
  validateSearch: (search: Record<string, unknown>): { mock?: BillingScenario } =>
    SCENARIOS.includes(search.mock as BillingScenario) ? { mock: search.mock as BillingScenario } : {},
  loaderDeps: ({ search }) => ({ mock: search.mock }),
  loader: async ({ context: { queryClient }, deps: { mock } }) => {
    if (mock) {
      resetBilling(mock)
      await queryClient.invalidateQueries({ queryKey: ['billing'] })
    }
    void queryClient.prefetchQuery(invoicesQuery)
    await queryClient.query(subscriptionQuery)
  },
  component: BillingPage,
})

function BillingPage() {
  return (
    <SettingsPage wide title="Billing" description="Manage your subscription and invoices">
      <BillingSettings />
    </SettingsPage>
  )
}
