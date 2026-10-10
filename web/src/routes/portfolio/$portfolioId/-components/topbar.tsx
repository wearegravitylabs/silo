import { useEffect, useState } from 'react'
import { useMe, UserAvatar } from '@/features/account'
import { CommandPalette } from '@/features/command-palette'
import { CurrencySelector, usePortfolio } from '@/features/portfolios'
import { ShareModal } from '@/features/sharing'
import { AiSparkleIcon, RefreshIcon, SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { useSiloAiPanel } from '@/stores/silo-ai-store'
import { SidebarMenuButton } from './sidebar'

/** App header (pinned by the shell): menu (mobile), search (⌘K palette) with Silo AI, last sync, currency, user, Share. */
export function Topbar({ portfolioId }: { portfolioId: string }) {
  const portfolio = usePortfolio(portfolioId)
  const toggleAi = useSiloAiPanel((s) => s.toggle)
  const { data: me } = useMe()
  const [sharing, setSharing] = useState(false)
  const [searching, setSearching] = useState(false)

  // ⌘K / Ctrl+K toggles the command palette from anywhere in the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearching((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 bg-background px-4 md:px-10">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarMenuButton />

        {/* Search opens the command palette (also ⌘K). Collapses to an icon on small screens. */}
        <div className="hidden h-8 w-72 items-center gap-2 rounded-lg bg-accent pr-3 md:flex lg:w-100">
          <button
            type="button"
            onClick={() => setSearching(true)}
            aria-label="Search (⌘K)"
            className="flex h-full min-w-0 flex-1 cursor-text items-center gap-2 rounded-lg pl-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <SearchIcon className="size-4 text-muted-foreground" />
            <span className="flex-1 text-muted-foreground">Search</span>
            <kbd className="font-sans text-xs tracking-widest text-subtle">⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={toggleAi}
            aria-label="Ask Silo AI"
            className="-mr-1 flex size-6 items-center justify-center rounded-md transition-colors hover:bg-background"
          >
            <AiSparkleIcon className="size-3.5" />
          </button>
        </div>
        <button
          type="button"
          aria-label="Search"
          onClick={() => setSearching(true)}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
        >
          <SearchIcon className="size-4" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-3 md:gap-6">
        <p className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
          <RefreshIcon className="size-3.5" />
          Last updated: just now
        </p>
        <div className="flex items-center gap-2 md:gap-3">
          <CurrencySelector portfolioId={portfolio.id} currentCode={portfolio.base_currency} />
          <Tooltip
            className="text-center"
            content={
              <>
                <span className="block font-medium">{me?.first_name ?? 'Account'}</span>
                <span className="block text-white/60">You</span>
              </>
            }
          >
            <span tabIndex={0} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
              <UserAvatar className="size-7 text-[10px] tracking-normal" />
            </span>
          </Tooltip>
          <Button variant="secondary" className="shadow-elevated" onClick={() => setSharing(true)}>
            Share
          </Button>
          {me && (
            <ShareModal
              open={sharing}
              onOpenChange={setSharing}
              owner={{ name: `${me.first_name} ${me.last_name}`, email: me.email, avatarUrl: me.avatar_url }}
            />
          )}
        </div>
      </div>
      <CommandPalette open={searching} onOpenChange={setSearching} />
    </header>
  )
}
