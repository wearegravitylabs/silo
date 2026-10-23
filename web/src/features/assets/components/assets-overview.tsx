import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { AssetItem } from '../types'

/**
 * The selected folder's stats, under its tab: value and number of assets, each split Investable / Non-Investable.
 * Side by side from md; stacked on phones.
 */
export function AssetsOverview({
  folderName,
  assets,
  currency,
  loading,
}: {
  folderName: string
  assets: AssetItem[]
  currency: string
  loading?: boolean
}) {
  const investable = assets.filter((a) => a.investability === 'investable')
  const other = assets.filter((a) => a.investability !== 'investable')
  const money = (list: AssetItem[]) =>
    formatMoney(
      list.reduce((sum, a) => sum + a.owned_value_converted, 0),
      currency,
    )

  return (
    <div className="grid bg-background md:grid-cols-2">
      <Stat title={`${folderName} Value`} main={money(assets)} investable={money(investable)} other={money(other)} loading={loading} />
      <Stat
        title="Total Assets"
        main={assets.length}
        investable={investable.length}
        other={other.length}
        loading={loading}
        className="border-t border-border md:border-t-0 md:border-l"
      />
    </div>
  )
}

function Stat({
  title,
  main,
  investable,
  other,
  loading,
  className,
}: {
  title: string
  main: string | number
  investable: string | number
  other: string | number
  loading?: boolean
  className?: string
}) {
  return (
    <section className={cn('flex min-w-0 flex-col px-4 pt-6 pb-4', className)}>
      <h2 className="flex min-w-0 items-center gap-2 font-sans text-sm leading-5.5 font-medium tracking-normal">
        <span aria-hidden className="size-3.5 shrink-0 rounded-full border-4 border-primary-dark" />
        <span className="truncate">{title}</span>
      </h2>
      {loading ? (
        <Skeleton className="mt-3.5 h-8 w-36 rounded-md" />
      ) : (
        <p className="mt-3.5 truncate font-heading text-2xl leading-8 font-bold text-foreground">{main}</p>
      )}
      <dl className="mt-4 grid grid-cols-2 gap-2">
        <Split label="Investable Assets" value={investable} loading={loading} />
        <Split label="Non-Investable Assets" value={other} loading={loading} dashed />
      </dl>
    </section>
  )
}

/** One half of the split: a ruled box with a bar along its foot — solid for investable, dotted for the rest. */
function Split({ label, value, loading, dashed }: { label: string; value: string | number; loading?: boolean; dashed?: boolean }) {
  return (
    <div className={cn('flex min-w-0 flex-col border-l', dashed ? 'border-primary-dark/40' : 'border-primary-dark')}>
      <dt className="truncate px-3 pt-1.5 text-xs leading-5 text-muted-foreground">{label}</dt>
      <dd className="truncate px-3 pt-2.5 pb-2.5 text-foreground">{loading ? <Skeleton className="h-4 w-20" /> : value}</dd>
      <span
        aria-hidden
        className={cn(
          'h-0.75',
          dashed
            ? 'bg-[repeating-linear-gradient(90deg,var(--color-primary-dark)_0_1px,transparent_1px_3px)] opacity-60'
            : 'bg-primary-dark',
        )}
      />
    </div>
  )
}
