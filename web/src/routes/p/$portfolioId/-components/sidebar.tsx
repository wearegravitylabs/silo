import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { UserAvatar } from '@/features/account'
import { AvatarFace, avatarIdFromImageUrl, usePortfolio, usePortfolios } from '@/features/portfolios'
import { ChevronDownIcon, PlusCircleIcon, Svg, type IconProps } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/stores/sidebar-store'

/** App navigation: portfolio switcher, sections, info card, user. Collapses to an icon rail. */
export function Sidebar({ portfolioId }: { portfolioId: string }) {
  const { collapsed, toggle } = useSidebarStore()

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-dvh shrink-0 flex-col justify-between overflow-hidden bg-surface transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
        collapsed ? 'w-16' : 'w-67',
      )}
    >
      <div className="flex flex-col gap-3">
        <div className={cn('flex h-14 items-center justify-between py-4', collapsed ? 'justify-center px-3' : 'pr-3 pl-3.5')}>
          <PortfolioSwitcher portfolioId={portfolioId} collapsed={collapsed} />
          {!collapsed && (
            <button
              type="button"
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="text-muted-foreground transition-opacity hover:opacity-60"
            >
              <CollapseIcon />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Expand sidebar"
            className="mx-auto flex h-8 w-10 items-center justify-center rounded-lg text-muted-foreground transition-opacity hover:opacity-60"
          >
            <CollapseIcon className="rotate-180" />
          </button>
        )}

        <nav className="flex flex-col items-center gap-1.5 px-1" aria-label="Sections">
          <NavLink to="/p/$portfolioId/dashboard" portfolioId={portfolioId} icon={<HomeIcon />} label="Dashboard" collapsed={collapsed} />
          <NavLink to="/p/$portfolioId/assets" portfolioId={portfolioId} icon={<FolderIcon />} label="Assets" collapsed={collapsed} />
          <NavPlaceholder icon={<DebtsIcon />} label="Debts" collapsed={collapsed} />
          <NavPlaceholder icon={<VaultIcon />} label="Vault" collapsed={collapsed} />
          <NavPlaceholder icon={<ProjectionsIcon />} label="Projections" collapsed={collapsed} />
        </nav>
      </div>

      <div className="flex flex-col">
        {!collapsed && (
          <div className="mx-3 mb-3 flex items-start gap-2 rounded-xl bg-background p-2 shadow-panel">
            <InfoIcon className="mt-0.75" />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm leading-5.5 font-medium">Open source &amp; private</span>
              <span className="text-xs leading-5 text-muted-foreground">Your data is never shared. Fully open source.</span>
              <a
                href="https://github.com/wearegravitylabs/silo"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 py-1 text-xs font-semibold text-primary-dark transition-opacity hover:opacity-70"
              >
                View source
                <ArrowUpRightIcon />
              </a>
            </div>
          </div>
        )}

        <div className={cn('flex h-14 items-center py-4', collapsed ? 'justify-center' : 'justify-between px-5')}>
          <UserAvatar className="size-6 text-[9px] tracking-normal" />
          {!collapsed && (
            <Link to="/login" aria-label="Log out" title="Log out" className="text-muted-foreground transition-opacity hover:opacity-70">
              <LogOutIcon />
            </Link>
          )}
        </div>
      </div>
    </aside>
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
            <span className="max-w-29 truncate text-sm font-medium">{portfolio.name}</span>
            <ChevronDownIcon />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {portfolios.map((p) => (
          <DropdownMenuItem key={p.id} asChild className={cn(p.id === portfolioId && 'bg-accent')}>
            <Link to="/p/$portfolioId/dashboard" params={{ portfolioId: p.id }}>
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const navItem = (collapsed: boolean) =>
  cn(
    'flex h-8 items-center rounded-lg text-sm leading-5.5 font-medium tracking-label transition-colors',
    'text-muted-foreground hover:bg-accent/60 data-[status=active]:bg-accent data-[status=active]:[&_svg]:text-foreground',
    'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
    collapsed ? 'w-10 justify-center p-1.25' : 'w-61 gap-1 px-2 py-1.25',
  )

function NavLink({
  to,
  portfolioId,
  icon,
  label,
  collapsed,
}: {
  to: '/p/$portfolioId/dashboard' | '/p/$portfolioId/assets'
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

// ─── Icons (sidebar-only) ─────────────────────────────────────────────────────
const nav = 'size-4 text-muted-foreground'

function HomeIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={nav} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M8.59 1.44a.85.85 0 0 0-1.18 0L1.25 7.06A.85.85 0 0 0 2.44 8.3l.06-.06V14c0 .47.38.85.85.85h3.4a.85.85 0 0 0 .85-.85v-3.4h1.7V14c0 .47.38.85.85.85h3.4c.47 0 .85-.38.85-.85V8.24l.06.06a.85.85 0 0 0 1.19-1.24L8.59 1.44Z"
      />
    </Svg>
  )
}

function FolderIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={nav} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M1.5 4.5a1 1 0 0 1 1-1H6l1.5 1.5H13a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1.5 1.5 0 0 1-1.5-1.5V4.5Z"
      />
    </Svg>
  )
}

function DebtsIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={nav} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M4 1.5h8A1.5 1.5 0 0 1 13.5 3v9.75a.75.75 0 0 1-1.1.66L11 12.44l-1.4.97a.75.75 0 0 1-.84 0L7.4 12.44 6 13.41a.75.75 0 0 1-1.1-.66V3A1.5 1.5 0 0 0 4 1.5Zm.25 3.25A.75.75 0 0 1 5 4h6a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75Zm.75 2.5a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5H5Z"
      />
    </Svg>
  )
}

function VaultIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={nav} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M8 1.5A3.25 3.25 0 0 0 4.75 4.75V6H3.5A1.5 1.5 0 0 0 2 7.5V14A1.5 1.5 0 0 0 3.5 15.5h9A1.5 1.5 0 0 0 14 14V7.5A1.5 1.5 0 0 0 12.5 6H11.25V4.75A3.25 3.25 0 0 0 8 1.5Zm1.75 4.5V4.75a1.75 1.75 0 1 0-3.5 0V6h3.5ZM8 9a1 1 0 0 1 .5 1.87V12h-1v-1.13A1 1 0 0 1 8 9Z"
      />
    </Svg>
  )
}

function ProjectionsIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={nav} {...props}>
      <path d="M2.5 5L6.5 8l-4 3M8.5 5L12.5 8l-4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function CollapseIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4', className)} {...props}>
      <path d="M10 3v10M3 8l4-3v6L3 8Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function InfoIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn(nav, className)} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M8 1.5a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 8 1.5ZM7.25 6a.75.75 0 0 1 1.5 0v5a.75.75 0 0 1-1.5 0V6Zm.75-2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"
      />
    </Svg>
  )
}

function LogOutIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className="size-4" {...props}>
      <path
        d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10.5 11l3-3-3-3M13.5 8H6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function ArrowUpRightIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 12 12" className="size-3" {...props}>
      <path d="M3.5 8.5L8.5 3.5M8.5 3.5H5M8.5 3.5V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
