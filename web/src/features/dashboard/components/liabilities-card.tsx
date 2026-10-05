import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import type { DashboardDebt, DashboardNetWorth } from '../types'
import { CardHead } from './card-head'
import { CreditCardIcon } from './icons'

export function LiabilitiesCard({ debts, nw }: { debts: DashboardDebt[]; nw: DashboardNetWorth }) {
  return (
    <Card>
      <CardHead icon={<CreditCardIcon />} title="Liabilities" />
      <div className="p-4">
        <div className="mb-4 flex flex-col gap-1">
          <span className="font-heading text-2xl leading-8 font-bold tracking-body">{formatCurrency(nw.debts, nw.currency)}</span>
          <span className="text-xs text-muted-foreground">Total outstanding</span>
        </div>
        {debts.length > 0 ? (
          <ul className="divide-y">
            {debts.map((d) => (
              <li key={d.debt_id} className="flex h-16 items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-destructive-subtle">
                    <CreditCardIcon />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{d.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{d.debt_type.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-negative">{formatCurrency(d.owned_balance, d.currency)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex h-25 items-center justify-center text-13 text-subtle">No liabilities yet</p>
        )}
      </div>
    </Card>
  )
}
