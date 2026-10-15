import { useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
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
  PlusIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  SproutIcon,
  UserIcon,
} from 'lucide-react'
import { useMe, UserAvatar, useUpgradePlan } from '@/features/account'
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
import { NavLabel, navItemClass, SidebarExpandButton, SidebarFrame, SidebarHeaderToggle } from '@/routes/-components/sidebar-frame'

/** App navigation: portfolio switcher, sections, Silo AI, what's new, user. */
export function Sidebar({ portfolioId }: { portfolioId: string }) {
  return <SidebarFrame>{(state) => <SidebarContent portfolioId={portfolioId} {...state} />}</SidebarFrame>
}

function SidebarContent({ portfolioId, collapsed, drawer }: { portfolioId: string; collapsed: boolean; drawer: boolean }) {
  return (
    <div className="flex h-full w-full flex-col justify-between">
      <div className="flex flex-col gap-3">
        <div className={cn('flex h-14 items-center justify-between py-4', collapsed ? 'justify-center px-3' : 'pr-3 pl-3.5')}>
          <PortfolioSwitcher portfolioId={portfolioId} collapsed={collapsed} />
          <SidebarHeaderToggle collapsed={collapsed} drawer={drawer} />
        </div>

        {collapsed && <SidebarExpandButton />}

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
          <NavLink
            to="/portfolio/$portfolioId/debts"
            portfolioId={portfolioId}
            icon={<BanknoteIcon />}
            label="Debts"
            collapsed={collapsed}
          />
          <NavLink to="/portfolio/$portfolioId/vault" portfolioId={portfolioId} icon={<LockIcon />} label="Vault" collapsed={collapsed} />
          <NavLink
            to="/portfolio/$portfolioId/projections"
            portfolioId={portfolioId}
            icon={<ChevronsRightIcon />}
            label="Projections"
            collapsed={collapsed}
          />
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
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const upgrade = useUpgradePlan()
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
          onClick={() => setUpgradeOpen(true)}
          className="mt-1.5 ml-6 flex w-fit items-center gap-1 rounded-md text-xs font-semibold text-primary-dark transition-opacity outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          Upgrade plan
          <ArrowUpRightIcon className="size-3" aria-hidden />
        </button>
        <UpgradeModal
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          defaultCurrency={portfolio.base_currency}
          upgrading={upgrade.isPending}
          // Simulated: ends the trial, so this card switches to "What's New".
          onUpgrade={() => upgrade.mutate(undefined, { onSuccess: () => setUpgradeOpen(false) })}
        />
      </div>
    )
  }

  return (
    <a href="#" className={cn(card, 'animate-rise gap-1.5 transition-shadow hover:shadow-elevated')}>
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

function NavLink({
  to,
  portfolioId,
  icon,
  label,
  collapsed,
}: {
  to:
    | '/portfolio/$portfolioId/dashboard'
    | '/portfolio/$portfolioId/assets'
    | '/portfolio/$portfolioId/debts'
    | '/portfolio/$portfolioId/vault'
    | '/portfolio/$portfolioId/projections'
  portfolioId: string
  icon: ReactNode
  label: string
  collapsed: boolean
}) {
  return (
    <Link to={to} params={{ portfolioId }} title={collapsed ? label : undefined} className={navItemClass(collapsed)}>
      {icon}
      <NavLabel collapsed={collapsed}>{label}</NavLabel>
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
      <span className={cn('flex items-center gap-0.5', up ? 'text-success' : 'text-destructive')}>
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
      <DropdownMenuContent side="top" align="start" sideOffset={10} className="w-61">
        <DropdownMenuItem asChild className="gap-2.5">
          <Link to="/settings/profile">
            <UserIcon className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2.5">
          <Link to="/settings/preferences">
            <SlidersHorizontalIcon className="size-4" />
            Preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2.5">
          <Link to="/settings">
            <SettingsIcon className="size-4" />
            Settings
          </Link>
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
      className={cn(navItemClass(collapsed), 'aria-pressed:bg-accent')}
    >
      <AiSparkleIcon />
      <NavLabel collapsed={collapsed}>Ask Silo AI</NavLabel>
    </button>
  )
}
