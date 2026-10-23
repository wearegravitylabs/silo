import { cn } from '@/lib/utils'
import { assetTypeIcon } from '../constants'
import type { AssetItem } from '../types'

/**
 * An asset's round mark (table rows, Projections): its logo, or else its type's icon on white — domains on a pink
 * disc. Size the disc with className (default 40px).
 */
export function AssetIconDisc({ asset, className }: { asset: Pick<AssetItem, 'asset_type' | 'logo_url'>; className?: string }) {
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
      {asset.logo_url ? <img src={asset.logo_url} alt="" className="size-full object-cover" /> : assetTypeIcon(asset.asset_type)}
    </span>
  )
}
