import { formatCurrency } from '@/lib/format'
import { BTN_SHADOW } from '@/lib/shadows'
import { useAssetOverview } from '../queries'
import type { AssetItem } from '../types'
import { ExportIcon } from './icons'

/** "Assets" heading: portfolio total, 30-day growth, Export and Create Asset actions. */
export function AssetsSummaryHeader({
  portfolioId, currency, folderAssets, canCreate, onCreate,
}: {
  portfolioId: string
  currency: string
  /** Fallback for the total while the overview loads */
  folderAssets: AssetItem[]
  canCreate: boolean
  onCreate: () => void
}) {
  const { data: overview } = useAssetOverview(portfolioId)
  const totalValue = overview?.total_assets?.value ?? folderAssets.reduce((s, a) => s + a.owned_value_converted, 0)
  const growth = overview?.growth_30d
  const growthPositive = (growth?.percentage ?? 0) >= 0

  return (
    <div className="flex items-center justify-between" style={{ padding: '20px 40px 0' }}>
      <div>
        <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#6E738C', marginBottom: '6px' }}>Assets</div>
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.3px', color: '#2C2E35' }}>
            {formatCurrency(totalValue, currency)}
          </span>
          {growth != null && (
            <div className="flex items-center gap-1.5" style={{ padding: '3px 8px', borderRadius: '6px', background: growthPositive ? '#F0FBF4' : '#FEF2F2' }}>
              <span style={{ fontSize: '12px', fontWeight: 500, color: growthPositive ? '#008753' : '#C50F3C' }}>
                {growthPositive ? '↗' : '↘'} {formatCurrency(Math.abs(growth.amount), currency)} ({Math.abs(growth.percentage).toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" disabled
          className="flex items-center gap-1.5 opacity-50 cursor-not-allowed"
          style={{ height: '32px', padding: '0 12px', borderRadius: '8px', background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)', boxShadow: BTN_SHADOW, border: 'none', fontSize: '13px', fontWeight: 500, color: '#2C2E35', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ExportIcon />
          Export
        </button>
        <button type="button" onClick={onCreate} disabled={!canCreate}
          className="flex items-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-[opacity,transform] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ height: '32px', padding: '0 14px', borderRadius: '8px', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', border: 'none', fontSize: '13px', fontWeight: 600, color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.3" /><path d="M7 4v6M4 7h6" stroke="white" strokeWidth="1.3" strokeLinecap="round" /></svg>
          Create Asset
        </button>
      </div>
    </div>
  )
}
