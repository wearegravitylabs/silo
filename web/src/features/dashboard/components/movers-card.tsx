import { formatCurrency } from '@/lib/format'
import type { DashboardMover } from '../types'
import { Card, CardHead } from './card'

export function MoverRow({ mover, currency, border = true }: { mover: DashboardMover; currency: string; border?: boolean }) {
  const up = (mover.change_pct ?? 0) >= 0
  return (
    <div className="flex items-center justify-between" style={{ padding: '12px 0', height: '64px', borderBottom: border ? '1px solid #EFF0F5' : undefined }}>
      <div className="flex items-center gap-3">
        {mover.logo_url ? (
          <img src={mover.logo_url} alt={mover.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div className="flex items-center justify-center font-semibold text-white" style={{ width: 36, height: 36, borderRadius: '50%', background: '#EFF0F5', fontSize: '13px', color: '#6E738C' }}>
            {mover.name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', lineHeight: '22px' }}>{mover.name}</span>
          {mover.ticker && <span style={{ fontSize: '12px', color: '#6E738C' }}>{mover.ticker}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35' }}>{formatCurrency(mover.current_value, currency)}</span>
        {mover.change_pct != null && (
          <span style={{ fontSize: '12px', fontWeight: 500, color: up ? '#008753' : '#C50F3C' }}>
            {up ? '+' : ''}{mover.change_pct.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  )
}

export function MoversCard({ title, icon, movers, currency, emptyMsg }: { title: string; icon: React.ReactNode; movers: DashboardMover[]; currency: string; emptyMsg: string }) {
  return (
    <Card className="flex-1">
      <CardHead icon={icon} title={title} />
      <div style={{ padding: '0 16px 8px' }}>
        {movers.length > 0 ? (
          movers.map((m, i) => <MoverRow key={m.asset_id} mover={m} currency={currency} border={i < movers.length - 1} />)
        ) : (
          <div className="flex items-center justify-center" style={{ height: '120px' }}>
            <span style={{ fontSize: '13px', color: '#B3B8CB', textAlign: 'center' }}>{emptyMsg}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
