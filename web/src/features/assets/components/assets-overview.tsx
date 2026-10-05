import { formatCurrency } from '@/lib/format'
import { PANEL_SHADOW } from '@/lib/shadows'
import type { AssetItem } from '../types'

export function StatCard({ title, main, investableLabel, nonInvestableLabel, loading }: { title: string; main: React.ReactNode; investableLabel: string; nonInvestableLabel: string; loading: boolean }) {
  return (
    <div style={{ flex: 1, background: '#FFF', boxShadow: PANEL_SHADOW, borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 12px' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2.5px solid #033AB8', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#6E738C', fontWeight: 500 }}>{title}</span>
        </div>
        {loading ? (
          <div style={{ height: '36px', width: '160px', background: '#EFF0F5', borderRadius: '6px' }} />
        ) : (
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px', color: '#2C2E35' }}>{main}</span>
        )}
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid #EFF0F5' }}>
        <div style={{ flex: 1, padding: '12px 16px 0', borderRight: '1px solid #EFF0F5' }}>
          <div style={{ fontSize: '11px', color: '#6E738C', marginBottom: '6px' }}>Investable Assets</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#2C2E35', marginBottom: '12px' }}>{investableLabel}</div>
          <div style={{ height: '2px', background: '#033AB8' }} />
        </div>
        <div style={{ flex: 1, padding: '12px 16px 0' }}>
          <div style={{ fontSize: '11px', color: '#6E738C', marginBottom: '6px' }}>Non-Investable Assets</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#2C2E35', marginBottom: '12px' }}>{nonInvestableLabel}</div>
          <div style={{ height: '2px', borderBottom: '2px dashed #033AB8' }} />
        </div>
      </div>
    </div>
  )
}

export function AssetsOverview({
  assets, currency, loading, showCards,
}: {
  assets: AssetItem[]
  currency: string
  loading: boolean
  showCards: boolean
}) {
  const investable = assets.filter((a) => a.investability === 'investable')
  const nonInvestable = assets.filter((a) => a.investability !== 'investable')
  const totalValue = assets.reduce((s, a) => s + (a.owned_value_converted ?? 0), 0)
  const investableValue = investable.reduce((s, a) => s + (a.owned_value_converted ?? 0), 0)
  const nonInvestableValue = nonInvestable.reduce((s, a) => s + (a.owned_value_converted ?? 0), 0)

  return (
    <div style={{ padding: '20px 40px 0' }}>
      {showCards && (
        <div style={{ display: 'flex', gap: '16px' }}>
          <StatCard
            title="Investment Value"
            main={formatCurrency(totalValue, currency)}
            investableLabel={formatCurrency(investableValue, currency)}
            nonInvestableLabel={formatCurrency(nonInvestableValue, currency)}
            loading={loading}
          />
          <StatCard
            title="Total Assets"
            main={String(assets.length)}
            investableLabel={String(investable.length)}
            nonInvestableLabel={String(nonInvestable.length)}
            loading={loading}
          />
        </div>
      )}
    </div>
  )
}
