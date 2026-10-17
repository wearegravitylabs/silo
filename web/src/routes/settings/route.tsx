import { createFileRoute, Outlet } from '@tanstack/react-router'
import { meQuery } from '@/features/account'
import { SubscriptionBanner } from '@/features/billing'
import { portfoliosQuery } from '@/features/portfolios'
import { MainPanel } from '@/routes/-components/main-panel'
import { SidebarMenuButton } from '@/routes/-components/sidebar-frame'
import { SettingsSidebar } from './-components/settings-sidebar'

/** Account settings shell: settings sidebar | page. Pages render a <SettingsPage> and scroll inside the panel. */
export const Route = createFileRoute('/settings')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([queryClient.query({ ...portfoliosQuery, staleTime: 'static' }), queryClient.query({ ...meQuery, staleTime: 'static' })]),
  component: SettingsLayout,
})

function SettingsLayout() {
  return (
    // Column so the subscription banner can sit under both the sidebar and the panel
    <div className="flex h-dvh flex-col bg-surface">
      <div className="flex min-h-0 flex-1">
        <SettingsSidebar className="h-full" />
        <MainPanel className="h-full">
          {/* Below lg the sidebar is a drawer: this bar opens it */}
          <header className="flex h-14 shrink-0 items-center gap-2 px-4 lg:hidden">
            <SidebarMenuButton />
            <span className="font-medium text-foreground">Settings</span>
          </header>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <Outlet />
          </div>
        </MainPanel>
      </div>
      <SubscriptionBanner />
    </div>
  )
}
