import { formatCurrency } from '@/lib/format'
import { type DashboardChartPoint, type DashboardNetWorth, type DashboardPeriod, PERIODS } from '../types'
import { Card, CardHead } from './card'
import { CoinIcon } from './icons'
import { LineChart } from './line-chart'

export function NetWorthCard({
  nw, chartPoints, period, onPeriod,
}: {
  nw: DashboardNetWorth
  chartPoints: DashboardChartPoint[]
  period: DashboardPeriod
  onPeriod: (p: DashboardPeriod) => void
}) {
  const up = (nw.change_pct ?? 0) >= 0
  return (
    <Card>
      <CardHead icon={<CoinIcon />} title="Net Worth" />
      {/* Stats */}
      <div className="flex items-end justify-between" style={{ padding: '16px 16px 0' }}>
        <div className="flex flex-col gap-1">
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 700, lineHeight: '36px', letterSpacing: '-0.3px', color: '#2C2E35' }}>
            {formatCurrency(nw.total, nw.currency)}
          </span>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: '12px', color: '#6E738C' }}>Total net worth</span>
            {nw.change_pct != null && (
              <>
                <span style={{ fontSize: '12px', color: '#B3B8CB' }}>·</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: up ? '#008753' : '#C50F3C' }}>
                  {up ? '+' : ''}{nw.change_pct.toFixed(2)}% this period
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-8">
          {([['#008753', 'Assets', nw.assets], ['#C50F3C', 'Liabilities', nw.debts]] as const).map(([color, label, val]) => (
            <div key={label} className="flex items-center gap-2">
              <div style={{ width: '4px', height: '40px', background: color, borderRadius: '16px', flexShrink: 0 }} />
              <div className="flex flex-col gap-1.5">
                <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px' }}>{label}</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{formatCurrency(val, nw.currency)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chart + tabs */}
      <div style={{ padding: '16px' }}>
        <LineChart points={chartPoints} />
        <div className="flex items-center justify-center" style={{ gap: '2px', marginTop: '8px' }}>
          {PERIODS.map(({ label }) => (
            <button key={label} type="button" onClick={() => onPeriod(label)}
              style={{ padding: '5px 10px', height: '24px', borderRadius: '8px', background: label === period ? '#EFF0F5' : 'transparent', fontSize: '12px', fontWeight: label === period ? 600 : 500, color: label === period ? '#2C2E35' : '#6E738C', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
