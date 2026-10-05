import { formatCurrency, formatDate } from '@/lib/format'
import { useAssetLots } from '../../queries'
import type { AssetItem } from '../../types'
import { TabBody, TabEmpty, TabListSkeleton } from './tab-layout'

export function HistoryTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const { data: lots, isPending } = useAssetLots(portfolioId, asset.id)

  return (
    <TabBody>
      {isPending ? (
        <TabListSkeleton rows={2} />
      ) : !lots?.length ? (
        <TabEmpty title="No history yet" body="Purchases and sales of this asset will show up here." />
      ) : (
        <ul className="flex flex-col gap-px overflow-hidden rounded-xl bg-accent">
          {lots.map((lot) => (
            <li key={lot.id} className="flex items-center justify-between bg-background px-4 py-3">
              <div>
                <p className="text-13 font-semibold">{lot.quantity.toLocaleString()} units acquired</p>
                <p className="mt-0.5 text-11 text-subtle">{formatDate(lot.acquisition_date)}</p>
              </div>
              <div className="text-right">
                <p className="text-13 font-semibold">
                  {lot.acquisition_price != null ? formatCurrency(lot.acquisition_price, asset.currency) : '—'}
                </p>
                <p className="text-11 text-subtle">per unit</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </TabBody>
  )
}
