import { formatCurrency } from '@/lib/format'
import type { DashboardDebt, DashboardNetWorth } from '../types'
import { Card, CardHead } from './card'
import { CreditCardIcon } from './icons'

export function DebtRow({ debt, border = true }: { debt: DashboardDebt; border?: boolean }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '12px 0', height: '64px', borderBottom: border ? '1px solid #EFF0F5' : undefined }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFF1F0' }}>
          <CreditCardIcon />
        </div>
        <div className="flex flex-col gap-0.5">
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35' }}>{debt.name}</span>
          <span style={{ fontSize: '12px', color: '#6E738C', textTransform: 'capitalize' }}>{debt.debt_type.replace(/_/g, ' ')}</span>
        </div>
      </div>
      <span style={{ fontSize: '14px', fontWeight: 500, color: '#C50F3C' }}>{formatCurrency(debt.owned_balance, debt.currency)}</span>
    </div>
  )
}

export function LiabilitiesCard({ debts, nw }: { debts: DashboardDebt[]; nw: DashboardNetWorth }) {
  return (
    <Card>
      <CardHead icon={<CreditCardIcon />} title="Liabilities" />
      <div style={{ padding: '16px' }}>
        {/* Summary */}
        <div className="flex items-start justify-between" style={{ marginBottom: '16px' }}>
          <div className="flex flex-col gap-1">
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, lineHeight: '32px', letterSpacing: '-0.1px', color: '#2C2E35' }}>{formatCurrency(nw.debts, nw.currency)}</span>
            <span style={{ fontSize: '12px', color: '#6E738C' }}>Total outstanding</span>
          </div>
        </div>
        {debts.length > 0 ? (
          debts.map((d, i) => <DebtRow key={d.debt_id} debt={d} border={i < debts.length - 1} />)
        ) : (
          <div className="flex items-center justify-center" style={{ height: '100px' }}>
            <span style={{ fontSize: '13px', color: '#B3B8CB' }}>No liabilities yet</span>
          </div>
        )}
      </div>
    </Card>
  )
}
