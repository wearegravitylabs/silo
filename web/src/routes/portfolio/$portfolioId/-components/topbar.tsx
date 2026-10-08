import { UserAvatar } from '@/features/account'
import { CurrencySelector, usePortfolio } from '@/features/portfolios'
import { AiSparkleIcon, RefreshIcon, SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { SidebarMenuButton } from './sidebar'

/** Sticky header: menu (mobile), search (placeholder), last sync, currency, user, Share. */
export function Topbar({ portfolioId, lastSyncedAt }: { portfolioId: string; lastSyncedAt?: string | null }) {
  const portfolio = usePortfolio(portfolioId)

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-4 bg-background px-4 md:px-10">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarMenuButton />

        {/* Search — placeholder until global search exists. Collapses to an icon on small screens. */}
        <div className="hidden h-8 w-72 cursor-text items-center gap-2 rounded-lg bg-accent px-3 md:flex lg:w-100">
          <SearchIcon className="size-4 text-muted-foreground" />
          <span className="flex-1 text-muted-foreground">Search</span>
          <kbd className="font-sans text-xs tracking-widest text-subtle">⌘K</kbd>
          <AiSparkleIcon className="ml-1 size-3.5" />
        </div>
        <button
          type="button"
          aria-label="Search"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
        >
          <SearchIcon className="size-4" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-3 md:gap-6">
        <p className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
          <RefreshIcon className="size-3.5" />
          Last updated: {lastUpdatedLabel(lastSyncedAt)}
        </p>
        <div className="flex items-center gap-2 md:gap-3">
          <CurrencySelector portfolioId={portfolio.id} currentCode={portfolio.base_currency} />
          <UserAvatar className="size-7 text-[10px] tracking-normal" />
          {/* Placeholder until portfolio sharing has a screen */}
          <Button variant="secondary" className="shadow-elevated">
            Share
          </Button>
        </div>
      </div>
    </header>
  )
}

/** "just now" within a minute, otherwise the local time ("10:42"). */
function lastUpdatedLabel(iso?: string | null) {
  if (!iso || Date.now() - new Date(iso).getTime() < 60_000) return 'just now'
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
