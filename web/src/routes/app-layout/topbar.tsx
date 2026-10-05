import { RefreshIcon, SearchIcon } from '@/components/icons'
import { CurrencySelector, useCurrentPortfolio } from '@/features/portfolios'
import { getUserInitials, useAuthStore } from '@/stores/auth-store'

/** Sticky header: search (placeholder), sync time, currency, user, primary action. */
export function Topbar({ lastSyncedAt, actionLabel }: { lastSyncedAt?: string | null; actionLabel: string }) {
  const { portfolio } = useCurrentPortfolio()
  const initials = getUserInitials(useAuthStore((s) => s.user))
  const lastSync = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <header className="flex items-center justify-between shrink-0" style={{ padding: '12px 40px', height: '56px', borderBottom: '1px solid #EFF0F5', position: 'sticky', top: 0, background: '#FFF', zIndex: 10 }}>
      {/* Search */}
      <div className="flex items-center gap-2" style={{ width: '400px', height: '32px', padding: '0 12px', background: '#EFF0F5', borderRadius: '10px', cursor: 'text' }}>
        <SearchIcon />
        <span style={{ fontSize: '14px', color: '#6E738C', flex: 1 }}>Search</span>
        <span style={{ fontSize: '11px', fontWeight: 500, color: '#B3B8CB', background: '#E3E5ED', borderRadius: '4px', padding: '1px 5px' }}>⌘K</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Refresh + timestamp */}
        <div className="flex items-center gap-1.5">
          <RefreshIcon />
          <span style={{ fontSize: '12px', color: '#6E738C' }}>
            {lastSync ? `Last synced ${lastSync}` : 'Last updated just now'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {portfolio && <CurrencySelector portfolioId={portfolio.id} currentCode={portfolio.base_currency} />}

          {/* User avatar */}
          <div
            className="flex items-center justify-center font-semibold text-white"
            style={{ width: '20px', height: '20px', borderRadius: '33px', background: '#033AB8', fontSize: '8px', flexShrink: 0, letterSpacing: '0.3px' }}
          >
            {initials}
          </div>

          {/* Primary action — visual placeholder */}
          <button
            type="button"
            className="flex items-center justify-center text-white font-semibold hover:opacity-90 active:scale-[0.97] transition-[opacity,transform]"
            style={{ width: '54px', height: '28px', borderRadius: '6px', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', fontSize: '12px', border: 'none', cursor: 'pointer' }}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </header>
  )
}
