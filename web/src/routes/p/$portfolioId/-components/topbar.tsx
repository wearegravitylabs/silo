import { UserAvatar } from '@/features/account'
import { CurrencySelector, usePortfolio } from '@/features/portfolios'
import { RefreshIcon, SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

/** Sticky header: search (placeholder), sync time, currency, user, primary action. */
export function Topbar({
  portfolioId,
  lastSyncedAt,
  actionLabel,
}: {
  portfolioId: string
  lastSyncedAt?: string | null
  actionLabel: string
}) {
  const portfolio = usePortfolio(portfolioId)
  const lastSync = lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background px-10 py-3">
      {/* Search — placeholder until global search exists */}
      <div className="flex h-8 w-100 cursor-text items-center gap-2 bg-accent px-3">
        <SearchIcon />
        <span className="flex-1 text-muted-foreground">Search</span>
        <kbd className="rounded-sm bg-line px-1.25 py-px font-sans font-medium text-subtle">⌘K</kbd>
      </div>

      <div className="flex items-center gap-6">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshIcon />
          {lastSync ? `Last synced ${lastSync}` : 'Last updated just now'}
        </p>
        <div className="flex items-center gap-3">
          <CurrencySelector portfolioId={portfolio.id} currentCode={portfolio.base_currency} />
          <UserAvatar />
          <Button size="xs" className="w-13.5 px-0">
            {actionLabel}
          </Button>
        </div>
      </div>
    </header>
  )
}
