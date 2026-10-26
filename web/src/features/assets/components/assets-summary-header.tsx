import { CirclePlusIcon, UploadIcon } from 'lucide-react'
import { ChangeText } from '@/components/change-text'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/format'
import { useAssetsOverview } from '../queries'

/** "Assets" heading: portfolio asset total, its 1M change, Export and Create Asset actions. */
export function AssetsSummaryHeader({
  portfolioId,
  onExport,
  onCreate,
}: {
  portfolioId: string
  onExport?: () => void
  /** Create Asset (disabled without it) */
  onCreate?: () => void
}) {
  const overview = useAssetsOverview(portfolioId)

  return (
    <PageHeader
      eyebrow="Assets"
      className="items-center px-4 pt-5 pb-5 md:px-10"
      title={
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h1 className="font-heading text-xl leading-7 font-bold tracking-[-0.3px]">{formatMoney(overview.total, overview.currency)}</h1>
          {overview.change && <ChangeText change={overview.change} currency={overview.currency} />}
        </div>
      }
      actions={
        <>
          <Button variant="secondary" onClick={onExport} className="font-medium">
            <UploadIcon className="size-3.5 text-muted-foreground" aria-hidden />
            Export
          </Button>
          <Button onClick={onCreate} disabled={!onCreate} className="px-3.5">
            <CirclePlusIcon className="size-3.5" aria-hidden />
            Create Asset
          </Button>
        </>
      }
    />
  )
}
