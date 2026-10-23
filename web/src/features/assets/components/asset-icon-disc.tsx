import { cn } from '@/lib/utils'
import { assetTypeIcon } from '../constants'
import type { AssetItem } from '../types'

/**
 * An asset's round mark (table rows, ticker search, Projections): its logo, else its ticker's initials ("MS"), else
 * its type's icon on white — domains on a pink disc. Size the disc with className (default 40px).
 */
export function AssetIconDisc({ asset, className }: { asset: Pick<AssetItem, 'asset_type' | 'logo_url' | 'ticker'>; className?: string }) {
  const domain = asset.asset_type === 'domain'
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border',
        domain
          ? 'border-destructive-light/60 bg-destructive-subtle text-destructive [&_svg]:text-destructive'
          : 'border-border bg-background',
        className,
      )}
    >
      {asset.logo_url ? (
        <img src={asset.logo_url} alt="" className="size-full object-cover" />
      ) : asset.ticker ? (
        <span aria-hidden className="text-xs font-semibold text-muted-foreground">
          {asset.ticker.slice(0, 2).toUpperCase()}
        </span>
      ) : (
        assetTypeIcon(asset.asset_type)
      )}
    </span>
  )
}
