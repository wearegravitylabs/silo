import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  ArrowUpRightIcon,
  BanknoteIcon,
  ChevronsRightIcon,
  CircleHelpIcon,
  CreditCardIcon,
  HouseIcon,
  InfoIcon,
  LockIcon,
  LogOutIcon,
  MenuIcon,
  PanelLeftIcon,
  SproutIcon,
  XIcon,
} from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useMe, UserAvatar } from '@/features/account'
import { AvatarFace, avatarIdFromImageUrl, usePortfolio, usePortfolios } from '@/features/portfolios'
import { AiSparkleIcon, ChevronDownIcon, PlusCircleIcon } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/stores/sidebar-store'

/** App navigation: portfolio switcher, sections, Silo AI, what's new, user. Desktop: sticky column that collapses
 * to an icon rail. Below lg: a drawer opened from the topbar's menu button. */
export function Sidebar({ portfolioId }: { portfolioId: string }) {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebarStore()
  const { pathname } = useLocation()

  // Navigating from the drawer should close it.
  useEffect(() => setMobileOpen(false), [pathname, setMobileOpen])

  return (
    <>
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 overflow-hidden bg-surface transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] lg:flex',
          collapsed ? 'w-16' : 'w-67',
        )}
      >
        <SidebarContent portfolioId={portfolioId} collapsed={collapsed} />
      </aside>

      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 lg:hidden data-open:animate-in data-open:fade-in-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 flex w-67 max-w-[85vw] animate-drawer-in bg-surface shadow-sheet outline-none lg:hidden"
          >
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            <SidebarContent portfolioId={portfolioId} collapsed={false} drawer />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}

/** Topbar button that opens the sidebar drawer. Only shown below lg, where the sidebar is hidden. */
export function SidebarMenuButton() {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen)
  return (
    <button
      type="button"
      aria-label="Open navigation"
      onClick={() => setMobileOpen(true)}
      className="-ml-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
    >
      <MenuIcon className="size-4.5" />
    </button>
  )
}

function SidebarContent({ portfolioId, collapsed, drawer = false }: { portfolioId: string; collapsed: boolean; drawer?: boolean }) {
  const toggle = useSidebarStore((s) => s.toggle)
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen)

  return (
    <div className="flex h-full w-full flex-col justify-between">
      <div className="flex flex-col gap-3">
        <div className={cn('flex h-14 items-center justify-between py-4', collapsed ? 'justify-center px-3' : 'pr-3 pl-3.5')}>
          <PortfolioSwitcher portfolioId={portfolioId} collapsed={collapsed} />
          {drawer ? (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="text-muted-foreground transition-opacity hover:opacity-60"
            >
              <XIcon className="size-4" />
            </button>
          ) : (
            !collapsed && (
              <button
                type="button"
                onClick={toggle}
                aria-label="Collapse sidebar"
                className="text-muted-foreground transition-opacity hover:opacity-60"
              >
                <PanelLeftIcon className="size-4" />
              </button>
            )
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Expand sidebar"
            className="mx-auto flex h-8 w-10 items-center justify-center rounded-lg text-muted-foreground transition-opacity hover:opacity-60"
          >
            <PanelLeftIcon className="size-4 rotate-180" />
          </button>
        )}

        <nav className="flex flex-col gap-1.5 px-2" aria-label="Sections">
          <NavLink
            to="/portfolio/$portfolioId/dashboard"
            portfolioId={portfolioId}
            icon={<HouseIcon />}
            label="Dashboard"
            collapsed={collapsed}
          />
          <NavLink
            to="/portfolio/$portfolioId/assets"
            portfolioId={portfolioId}
            icon={<CreditCardIcon />}
            label="Assets"
            collapsed={collapsed}
          />
          <NavPlaceholder icon={<BanknoteIcon />} label="Debts" collapsed={collapsed} />
          <NavPlaceholder icon={<LockIcon />} label="Vault" collapsed={collapsed} />
          <NavPlaceholder icon={<ChevronsRightIcon />} label="Projections" collapsed={collapsed} />
        </nav>
      </div>

      <div className="flex flex-col gap-3">
        <div className="px-2">
          <NavPlaceholder icon={<AiSparkleIcon />} label="Ask Silo AI" collapsed={collapsed} />
        </div>

        {!collapsed && <SidebarCard />}

        <div className={cn('flex h-14 items-center py-4', collapsed ? 'justify-center' : 'justify-between px-4')}>
          <UserAvatar className="size-6 text-[9px] tracking-normal" />
          {!collapsed && (
            <a
              href="mailto:support@silo.app"
              aria-label="Help"
              title="Help"
              className="text-muted-foreground transition-opacity hover:opacity-70"
            >
              <CircleHelpIcon className="size-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function PortfolioSwitcher({ portfolioId, collapsed }: { portfolioId: string; collapsed: boolean }) {
  const portfolio = usePortfolio(portfolioId)
  const portfolios = usePortfolios()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Portfolio: ${portfolio.name}`}
        className={cn(
          'flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          collapsed && 'mx-auto',
        )}
      >
        <AvatarFace id={avatarIdFromImageUrl(portfolio.image_url)} className="size-6" />
        {!collapsed && (
          <>
            <span className="max-w-29 truncate font-medium">{portfolio.name}</span>
            <ChevronDownIcon />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {portfolios.map((p) => (
          <DropdownMenuItem key={p.id} asChild className={cn(p.id === portfolioId && 'bg-accent')}>
            <Link to="/portfolio/$portfolioId/dashboard" params={{ portfolioId: p.id }}>
              <AvatarFace id={avatarIdFromImageUrl(p.image_url)} className="size-5" />
              <span className="truncate">{p.name}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/onboarding/portfolio">
            <PlusCircleIcon className="size-4" />
            Create portfolio
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/login">
            <LogOutIcon className="size-4" />
            Log out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Bottom card: the trial countdown while the user is on a free trial, otherwise what's new. */
function SidebarCard() {
  const { data: me } = useMe()
  const card = 'mx-2 flex flex-col rounded-xl bg-background p-3 shadow-panel'

  if (me?.trial_days_left != null) {
    const days = me.trial_days_left
    return (
      <div className={cn(card, 'gap-1')}>
        <span className="flex items-center gap-2 font-medium text-foreground">
          <InfoIcon className="size-4 shrink-0 fill-muted-foreground text-white" aria-hidden />
          Free trial ending soon
        </span>
        <p className="pl-6 text-xs leading-5">
          You have just{' '}
          <span className="text-warning">
            {days} {days === 1 ? 'day' : 'days'}
          </span>{' '}
          left to use Silo on free trial
        </p>
        {/* TODO: billing page */}
        <a
          href="#"
          className="mt-1.5 flex w-fit items-center gap-1 pl-6 text-xs font-semibold text-primary-dark transition-opacity hover:opacity-70"
        >
          Upgrade plan
          <ArrowUpRightIcon className="size-3" aria-hidden />
        </a>
      </div>
    )
  }

  return (
    <a href="#" className={cn(card, 'gap-1.5 transition-shadow hover:shadow-elevated')}>
      <span className="flex items-center justify-between text-xs leading-5 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <SproutIcon className="size-3.5 text-success" aria-hidden />
          What&apos;s New?
        </span>
        <ArrowUpRightIcon className="size-3.5" aria-hidden />
      </span>
      <span className="truncate font-medium text-foreground">Silo AI, Vault, Multi-portfolio management and more</span>
    </a>
  )
}

const navItem = (collapsed: boolean) =>
  cn(
    'flex h-8 items-center rounded-lg leading-5.5 font-medium transition-colors',
    'text-muted-foreground hover:bg-accent/60 data-[status=active]:bg-accent [&_svg]:size-4 data-[status=active]:[&_svg]:text-foreground',
    'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
    collapsed ? 'mx-auto w-10 justify-center p-1.25' : 'w-full gap-1 px-2 py-1.25',
  )

function NavLink({
  to,
  portfolioId,
  icon,
  label,
  collapsed,
}: {
  to: '/portfolio/$portfolioId/dashboard' | '/portfolio/$portfolioId/assets'
  portfolioId: string
  icon: ReactNode
  label: string
  collapsed: boolean
}) {
  return (
    <Link to={to} params={{ portfolioId }} title={collapsed ? label : undefined} className={navItem(collapsed)}>
      {icon}
      {!collapsed && <span className="pl-1 text-foreground">{label}</span>}
    </Link>
  )
}

/** Section that isn't built yet: same look, not clickable. */
function NavPlaceholder({ icon, label, collapsed }: { icon: ReactNode; label: string; collapsed: boolean }) {
  return (
    <span aria-disabled="true" title={`${label} — coming soon`} className={cn(navItem(collapsed), 'cursor-default hover:bg-transparent')}>
      {icon}
      {!collapsed && <span className="pl-1 text-foreground">{label}</span>}
    </span>
  )
}
