import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { AssetItem } from '../types'

/** Two stat cards (value, count) for the current folder, split investable / non-investable. */
export function AssetsOverview({ assets, currency, loading }: { assets: AssetItem[]; currency: string; loading?: boolean }) {
  const investable = assets.filter((a) => a.investability === 'investable')
  const other = assets.filter((a) => a.investability !== 'investable')
  const sum = (list: AssetItem[]) => list.reduce((s, a) => s + (a.owned_value_converted ?? 0), 0)
  const money = (list: AssetItem[]) => formatCurrency(sum(list), currency)

  return (
    <div className="flex gap-4 px-10 pt-5">
      <StatCard title="Investment Value" main={money(assets)} investable={money(investable)} other={money(other)} loading={loading} />
      <StatCard title="Total Assets" main={assets.length} investable={investable.length} other={other.length} loading={loading} />
    </div>
  )
}

function StatCard({
  title,
  main,
  investable,
  other,
  loading,
}: {
  title: string
  main: string | number
  investable: string | number
  other: string | number
  loading?: boolean
}) {
  const split = [
    { label: 'Investable Assets', value: investable, rule: 'border-solid' },
    { label: 'Non-Investable Assets', value: other, rule: 'border-dashed' },
  ]
  return (
    <Card className="flex-1">
      <div className="px-4 pt-4 pb-3">
        <h3 className="mb-2 flex items-center gap-2 text-13 font-medium text-muted-foreground">
          <span className="size-2.5 shrink-0 rounded-full border-[2.5px] border-primary-dark" />
          {title}
        </h3>
        {loading ? (
          <Skeleton className="h-9 w-40 rounded-md" />
        ) : (
          <span className="font-heading text-32 leading-[1.1] font-bold tracking-[-0.5px]">{main}</span>
        )}
      </div>
      <dl className="flex divide-x border-t">
        {split.map(({ label, value, rule }) => (
          <div key={label} className="flex-1 px-4 pt-3">
            <dt className="mb-1.5 text-11 text-muted-foreground">{label}</dt>
            <dd className="mb-3 text-15 font-semibold">{loading ? <Skeleton className="h-4 w-20" /> : value}</dd>
            <div className={cn('border-b-2 border-primary-dark', rule)} />
          </div>
        ))}
      </dl>
    </Card>
  )
}
