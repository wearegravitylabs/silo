import type { AssetAttachment } from '../../types'

/** Preview of an asset Silo AI is about to create: logo tile, name, value. */
export function AssetCard({ asset }: { asset: AssetAttachment }) {
  return (
    <div className="flex w-fit animate-rise items-center gap-2.5 rounded-xl bg-accent py-2 pr-8 pl-2">
      <span
        aria-hidden
        className="flex size-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md bg-destructive font-sans text-xs font-bold text-white"
      >
        <span className="h-px w-6 bg-white/80" />
        {asset.mark}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-medium text-foreground">{asset.name}</span>
        <span className="text-xs leading-4 text-muted-foreground">{asset.value}</span>
      </span>
    </div>
  )
}
