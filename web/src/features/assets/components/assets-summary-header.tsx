import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { useAssetOverview } from '../queries'
import { ChangeBadge } from './change-badge'
import { ExportIcon } from './icons'

/** "Assets" heading: portfolio total, 30-day growth, Export and Create Asset actions. */
export function AssetsSummaryHeader({ portfolioId, currency, onCreate }: { portfolioId: string; currency: string; onCreate: () => void }) {
  const { total_assets, growth_30d: growth } = useAssetOverview(portfolioId)

  return (
    <PageHeader
      eyebrow="Assets"
      className="items-center pt-5"
      title={
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-28 font-bold tracking-[-0.3px]">{formatCurrency(total_assets.value, currency)}</h1>
          {growth && (
            <ChangeBadge pct={growth.percentage}>
              {formatCurrency(Math.abs(growth.amount), currency)} ({Math.abs(growth.percentage).toFixed(1)}%)
            </ChangeBadge>
          )}
        </div>
      }
      actions={
        <>
          <Button variant="secondary" disabled className="font-medium">
            <ExportIcon />
            Export
          </Button>
          <Button onClick={onCreate} className="px-3.5">
            <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className="size-3.5">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
              <path d="M7 4v6M4 7h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Create Asset
          </Button>
        </>
      }
    />
  )
}
