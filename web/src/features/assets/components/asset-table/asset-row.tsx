import { useState } from 'react'
import { FlagIcon } from 'lucide-react'
import { ChangeBadge } from '@/components/change-badge'
import { SelectCell } from '@/components/data-table'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ASSET_TYPE_LABELS } from '../../constants'
import type { AssetItem, FolderRef } from '../../types'
import { AssetIconDisc } from '../asset-icon-disc'
import { AssetRowMenu } from './asset-row-menu'

/**
 * One 72px asset row: logo disc, name (+ attention flag) over its ticker or round, type over its status, 1M change,
 * value over units held, ⋯ menu.
 */
export function AssetRow({
  asset,
  folders,
  defaultFolderId,
  selected,
  onSelect,
  onView,
  onMove,
  onAddRule,
  onDelete,
}: {
  asset: AssetItem
  folders: FolderRef[]
  defaultFolderId: string
  selected: boolean
  onSelect: (selected: boolean) => void
  onView?: () => void
  onMove?: (folderId: string) => void
  onAddRule?: () => void
  onDelete?: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const units = asset.total_quantity != null && asset.ticker ? `${asset.total_quantity.toLocaleString('en-US')} ${asset.ticker}` : null

  return (
    <tr className={cn('h-18 transition-colors', (menuOpen || selected) && 'bg-surface')}>
      <SelectCell checked={selected} onChange={onSelect} label={`Select ${asset.name}`} />
      <td>
        <div className="flex min-w-0 items-center gap-2">
          <AssetIconDisc asset={asset} />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
              <span className="truncate">{asset.name}</span>
              {asset.needs_attention && (
                <FlagIcon className="size-3 shrink-0 fill-primary-dark text-primary-dark" aria-label="Needs attention" />
              )}
            </span>
            {asset.detail && <span className="truncate text-xs leading-4 text-muted-foreground">{asset.detail}</span>}
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-foreground">{ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}</span>
          {asset.status && <span className="truncate text-xs leading-4 text-muted-foreground">{asset.status}</span>}
        </div>
      </td>
      <td className="hidden md:table-cell">
        <ChangeBadge pct={asset.change_pct_1m} hideEmpty />
      </td>
      <td className="text-right">
        <div className="flex flex-col items-end gap-1">
          <span className="text-foreground">{formatMoney(asset.owned_value_converted, asset.converted_currency)}</span>
          {units && <span className="text-xs leading-4 text-muted-foreground">{units}</span>}
        </div>
      </td>
      <td className="pr-3 text-right md:pr-4">
        <AssetRowMenu
          name={asset.name}
          folders={folders}
          folderId={asset.folder_id ?? defaultFolderId}
          onOpenChange={setMenuOpen}
          onView={onView}
          onMove={onMove}
          onAddRule={onAddRule}
          onDelete={onDelete}
        />
      </td>
    </tr>
  )
}
