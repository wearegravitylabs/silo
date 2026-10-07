import { cn } from '@/lib/utils'
import type { AssetItem } from '../types'

/** Round asset mark: logo image, the API's SVG icon, or ticker/name initials. */
export function AssetLogo({ asset, className }: { asset: Pick<AssetItem, 'name' | 'ticker' | 'logo_url' | 'icon'>; className?: string }) {
  return (
    <span className={cn('flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-surface', className)}>
      {asset.logo_url ? (
        <img src={asset.logo_url} alt="" className="size-full object-cover" />
      ) : asset.icon ? (
        // Trusted SVG markup from the Silo API
        <span aria-hidden className="flex size-4.5 items-center justify-center" dangerouslySetInnerHTML={{ __html: asset.icon }} />
      ) : (
        <span className="font-bold text-muted-foreground">{(asset.ticker || asset.name).slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  )
}
