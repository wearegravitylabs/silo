import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  ArrowDownIcon,
  ArrowUpIcon,
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
  PlusIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  SproutIcon,
  UserIcon,
  XIcon,
} from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useMe, UserAvatar } from '@/features/account'
import { UpgradeModal } from '@/features/billing'
import { AvatarFace, avatarIdFromImageUrl, usePortfolio, usePortfolios } from '@/features/portfolios'
import { AiSparkleIcon, ChevronDownIcon } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCompactMoney, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSiloAiPanel } from '@/stores/silo-ai-store'
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
          'sticky top-0 hidden h-dvh shrink-0 overflow-hidden bg-surface transition-[width] duration-200 ease-in-out lg:flex',
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
          <AskSiloAiButton collapsed={collapsed} />
        </div>

        {!collapsed && <SidebarCard portfolioId={portfolioId} />}

        <div className={cn('flex h-14 items-center py-4', collapsed ? 'justify-center' : 'justify-between px-4')}>
          <UserMenu />
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
      <DropdownMenuContent className="w-70" sideOffset={6}>
        {portfolios.map((p) => (
          <DropdownMenuItem key={p.id} asChild className="gap-2.5 py-2">
            <Link to="/portfolio/$portfolioId/dashboard" params={{ portfolioId: p.id }}>
              <AvatarFace id={avatarIdFromImageUrl(p.image_url)} className="size-8" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-foreground">{p.name}</span>
                {p.summary && <PortfolioValue currency={p.base_currency} {...p.summary} />}
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          asChild
          className="mx-1 my-1 justify-center gap-1 bg-gradient-secondary py-1 text-xs font-semibold shadow-small focus:bg-gradient-secondary focus:opacity-80"
        >
          <Link to="/onboarding/portfolio">
            <PlusIcon className="size-3.5" />
            Create a New Portfolio
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="mx-0" />
        {/* Placeholder until portfolio settings exist */}
        <DropdownMenuItem className="gap-2.5">
          <SettingsIcon className="size-4" />
          Portfolio settings
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2.5">
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
function SidebarCard({ portfolioId }: { portfolioId: string }) {
  const { data: me } = useMe()
  const portfolio = usePortfolio(portfolioId)
  const [upgrading, setUpgrading] = useState(false)
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
        <button
          type="button"
          onClick={() => setUpgrading(true)}
          className="mt-1.5 ml-6 flex w-fit items-center gap-1 rounded-md text-xs font-semibold text-primary-dark transition-opacity outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          Upgrade plan
          <ArrowUpRightIcon className="size-3" aria-hidden />
        </button>
        <UpgradeModal open={upgrading} onOpenChange={setUpgrading} defaultCurrency={portfolio.base_currency} />
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

/** "₦ 1,000,000.00 ↑ ₦1k (12%)" under a portfolio's name. */
function PortfolioValue({
  currency,
  net_worth,
  change_amount,
  change_pct,
}: {
  currency: string
  net_worth: number
  change_amount: number
  change_pct: number
}) {
  const up = change_amount >= 0
  return (
    <span className="flex items-center gap-1.5 text-xs leading-5 text-muted-foreground">
      {formatMoney(net_worth, currency)}
      <span className={cn('flex items-center gap-0.5', up ? 'text-positive' : 'text-negative')}>
        {up ? <ArrowUpIcon className="size-3 text-inherit!" /> : <ArrowDownIcon className="size-3 text-inherit!" />}
        {formatCompactMoney(Math.abs(change_amount), currency)} ({Math.abs(Math.round(change_pct))}%)
      </span>
    </span>
  )
}

/** Your avatar at the bottom of the sidebar: opens Profile / Preferences / Settings above it. */
function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Account menu" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
        <UserAvatar className="size-6 text-[9px] tracking-normal" />
      </DropdownMenuTrigger>
      {/* Placeholders until the account pages exist */}
      <DropdownMenuContent side="top" align="start" sideOffset={10} className="w-61">
        <DropdownMenuItem className="gap-2.5">
          <UserIcon className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2.5">
          <SlidersHorizontalIcon className="size-4" />
          Preferences
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2.5">
          <SettingsIcon className="size-4" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Opens/closes the Silo AI panel; looks like a nav item, highlighted while the panel is open. */
function AskSiloAiButton({ collapsed }: { collapsed: boolean }) {
  const { open, toggle, setOpen } = useSiloAiPanel()
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen)
  return (
    <button
      type="button"
      aria-pressed={open}
      title={collapsed ? 'Ask Silo AI' : undefined}
      onClick={() => {
        // From the mobile drawer: close the drawer and open the AI sheet in its place.
        setMobileOpen(false)
        if (open) toggle()
        else setOpen(true)
      }}
      className={cn(navItem(collapsed), 'aria-pressed:bg-accent')}
    >
      <AiSparkleIcon />
      {!collapsed && <span className="pl-1 text-foreground">Ask Silo AI</span>}
    </button>
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
