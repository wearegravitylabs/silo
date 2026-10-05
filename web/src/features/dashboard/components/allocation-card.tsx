import { formatCurrency } from '@/lib/format'
import type { DashboardAllocItem, DashboardResponse } from '../types'
import { Card, CardHead, Sk } from './card'
import { PieIcon } from './icons'

export const ALLOC_COLORS = ['#033AB8', '#6C8EFF', '#B3C4FF', '#D6DFFF', '#EEF2FF']

export function AllocationSection({ items, label, currency }: { items: DashboardAllocItem[]; label: string; currency: string }) {
  const total = items.reduce((s, i) => s + i.value, 0)

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0">
      <div className="flex flex-col gap-0.5">
        <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, lineHeight: '26px', color: '#2C2E35' }}>
          {total > 0 ? formatCurrency(total, currency) : '—'}
        </span>
      </div>

      {/* Stacked bar */}
      {items.length > 0 ? (
        <div className="flex gap-0.5 rounded overflow-hidden" style={{ height: '8px' }}>
          {items.map((item, i) => (
            <div key={item.label} style={{ width: `${item.pct}%`, background: ALLOC_COLORS[i % ALLOC_COLORS.length], borderRadius: '2px', minWidth: '4px' }} />
          ))}
        </div>
      ) : (
        <div style={{ height: '8px', background: '#EFF0F5', borderRadius: '4px' }} />
      )}

      {/* Rows */}
      <div className="flex flex-col">
        {items.length > 0 ? (
          items.map((item, i) => (
            <div key={item.label} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: i < items.length - 1 ? '1px solid #EFF0F5' : undefined, height: '40px' }}>
              <div className="flex items-center gap-2">
                <div style={{ width: '4px', height: '12px', background: ALLOC_COLORS[i % ALLOC_COLORS.length], borderRadius: '4px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#2C2E35' }}>{item.label}</span>
                {item.count != null && (
                  <span style={{ fontSize: '11px', color: '#B3B8CB' }}>{item.count}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '12px', color: '#6E738C' }}>{item.pct.toFixed(1)}%</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#2C2E35' }}>{formatCurrency(item.value, currency)}</span>
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="flex items-center justify-between" style={{ height: '40px', borderBottom: '1px solid #EFF0F5' }}>
              <Sk w={80} h={13} />
              <Sk w={48} h={13} />
            </div>
            <div className="flex items-center justify-between" style={{ height: '40px', borderBottom: '1px solid #EFF0F5' }}>
              <Sk w={64} h={13} />
              <Sk w={48} h={13} />
            </div>
            <div className="flex items-center justify-between" style={{ height: '40px' }}>
              <Sk w={72} h={13} />
              <Sk w={48} h={13} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function AllocationCard({ allocation, currency }: { allocation: DashboardResponse['allocation']; currency: string }) {
  return (
    <Card>
      <CardHead icon={<PieIcon />} title="Asset Allocation" />
      <div className="flex" style={{ padding: '16px', gap: '24px' }}>
        <AllocationSection items={allocation.assets} label="Assets" currency={currency} />
        <div style={{ width: '1px', background: '#EFF0F5', flexShrink: 0 }} />
        <AllocationSection items={allocation.debts} label="Liabilities" currency={currency} />
      </div>
    </Card>
  )
}
