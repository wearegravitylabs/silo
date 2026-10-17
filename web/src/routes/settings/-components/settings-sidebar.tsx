import type { ReactNode } from 'react'
import { Link, useCanGoBack, useParams, useRouter } from '@tanstack/react-router'
import { BellIcon, ChevronLeftIcon, CreditCardIcon, KeyRoundIcon, PlusIcon, SlidersHorizontalIcon, UserIcon, UsersIcon } from 'lucide-react'
import { AvatarFace, avatarIdFromImageUrl, usePortfolios } from '@/features/portfolios'
import { cn } from '@/lib/utils'
import { NavLabel, navItemClass, SidebarExpandButton, SidebarFrame, SidebarHeaderToggle } from '@/routes/-components/sidebar-frame'

type SettingsPath =
  | '/settings/profile'
  | '/settings/preferences'
  | '/settings/notifications'
  | '/settings/security'
  | '/settings/partners'
  | '/settings/billing'

const SECTIONS: { label?: string; items: { to: SettingsPath; icon: ReactNode; label: string }[] }[] = [
  {
    items: [
      { to: '/settings/profile', icon: <UserIcon />, label: 'Profile' },
      { to: '/settings/preferences', icon: <SlidersHorizontalIcon />, label: 'Preferences' },
      { to: '/settings/notifications', icon: <BellIcon />, label: 'Notifications' },
      { to: '/settings/security', icon: <KeyRoundIcon />, label: 'Security & Access' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/settings/partners', icon: <UsersIcon />, label: 'Partners' },
      { to: '/settings/billing', icon: <CreditCardIcon />, label: 'Billing' },
    ],
  },
]

/** Settings navigation: Back, account pages, administration, your portfolios. Collapses like the app sidebar. */
export function SettingsSidebar({ className }: { className?: string }) {
  return <SidebarFrame className={className}>{(state) => <SettingsSidebarContent {...state} />}</SidebarFrame>
}

function SettingsSidebarContent({ collapsed, drawer }: { collapsed: boolean; drawer: boolean }) {
  const portfolios = usePortfolios()
  // The portfolio page you're on, so Create a portfolio can lead back to it
  const { portfolioId } = useParams({ strict: false })

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-y-auto">
      <div className={cn('flex h-14 shrink-0 items-center justify-between py-4', collapsed ? 'justify-center px-3' : 'pr-3 pl-3.5')}>
        <BackButton collapsed={collapsed} />
        <SidebarHeaderToggle collapsed={collapsed} drawer={drawer} />
      </div>

      {collapsed && <SidebarExpandButton />}

      <nav className="flex flex-col gap-5.5 px-2 pb-4" aria-label="Settings">
        {SECTIONS.map((section, i) => (
          <NavSection key={i} label={section.label} collapsed={collapsed}>
            {section.items.map(({ to, icon, label }) => (
              // replace: Back leaves settings in one step, however many pages were visited
              <Link key={to} to={to} replace title={collapsed ? label : undefined} className={navItemClass(collapsed)}>
                {icon}
                <NavLabel collapsed={collapsed}>{label}</NavLabel>
              </Link>
            ))}
          </NavSection>
        ))}

        <NavSection label="Your portfolio" collapsed={collapsed}>
          {portfolios.map((p) => (
            <Link
              key={p.id}
              to="/settings/portfolios/$portfolioId"
              params={{ portfolioId: p.id }}
              replace
              title={collapsed ? p.name : undefined}
              className={navItemClass(collapsed)}
            >
              <AvatarFace id={avatarIdFromImageUrl(p.image_url)} className="size-4 shrink-0" />
              <NavLabel collapsed={collapsed}>{p.name}</NavLabel>
            </Link>
          ))}
          <Link
            to="/settings/portfolios/new"
            search={{ from: portfolioId }}
            replace
            title={collapsed ? 'Create a portfolio' : undefined}
            className={navItemClass(collapsed)}
          >
            <PlusIcon />
            <NavLabel collapsed={collapsed}>Create a portfolio</NavLabel>
          </Link>
        </NavSection>
      </nav>
    </div>
  )
}

/** A labelled group of nav items; on the rail the label gives way to a thin rule. */
function NavSection({ label, collapsed, children }: { label?: string; collapsed: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label &&
        (collapsed ? (
          <hr className="mx-auto mb-1 w-6 border-line" />
        ) : (
          <span className="px-2 pb-0.5 text-xs leading-4 text-muted-foreground">{label}</span>
        ))}
      {children}
    </div>
  )
}

/** Leaves settings: back to wherever you came from, or the app's home on a fresh load. */
function BackButton({ collapsed }: { collapsed: boolean }) {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return (
    <button
      type="button"
      onClick={() => (canGoBack ? router.history.back() : router.navigate({ to: '/' }))}
      aria-label={collapsed ? 'Back' : undefined}
      title={collapsed ? 'Back' : undefined}
      className="flex items-center gap-1.5 rounded-md text-muted-foreground transition-opacity outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <ChevronLeftIcon className="size-3.5" />
      {!collapsed && 'Back'}
    </button>
  )
}
