import { useState } from 'react'
import { DataTable, TableSearch, useTableView, type DataColumn } from '@/components/data-table'
import { MultiFilterMenu } from '@/components/multi-filter-menu'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ASSET_TYPE_FILTER_OPTIONS, ASSET_TYPE_LABELS, INVESTABILITY_FILTER_OPTIONS } from '../../constants'
import type { AssetItem, FolderRef } from '../../types'
import { AssetRow } from './asset-row'

type SortKey = 'name' | 'type' | 'change' | 'value'

// Type and 1M drop out on small screens; Asset and Value always show.
const COLUMNS: DataColumn<SortKey>[] = [
  { key: 'name', label: 'Asset' },
  { key: 'type', label: 'Type', hideOnMobile: true, width: 'w-50' },
  { key: 'change', label: '1M', hideOnMobile: true, width: 'w-30' },
  { key: 'value', label: 'Value', align: 'right', width: 'w-32 md:w-36' },
]

/** Sort value per column; assets without a 1M change sink to the bottom either way. */
const SORT_VALUE: Record<SortKey, (a: AssetItem) => string | number | null> = {
  name: (a) => a.name.toLowerCase(),
  type: (a) => ASSET_TYPE_LABELS[a.asset_type] ?? a.asset_type,
  change: (a) => a.change_pct_1m,
  value: (a) => a.owned_value_converted,
}

/** Manual and ticker stocks (or crypto) filter as one type. */
const typeKey = (type: string) => type.replace('_manual', '_ticker')

/**
 * Filterable, sortable, paginated asset list for one folder. `loading` shows skeleton rows; `dimmed` while another
 * folder loads. Any change to filters, search, sort or page size goes back to page 1.
 */
export function AssetTable({
  assets,
  folders,
  defaultFolderId,
  loading,
  dimmed,
  className,
  onView,
  onMove,
  onAddRule,
  onDelete,
}: {
  assets: AssetItem[]
  /** For the row menus' Move Folders */
  folders: FolderRef[]
  defaultFolderId: string
  loading?: boolean
  dimmed?: boolean
  className?: string
  onView?: (asset: AssetItem) => void
  onMove?: (asset: AssetItem, folderId: string) => void
  onAddRule?: (asset: AssetItem) => void
  onDelete?: (asset: AssetItem) => void
}) {
  const [types, setTypes] = useState<string[]>([])
  const [investability, setInvestability] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const q = search.trim().toLowerCase()
  const filtered = assets.filter(
    (a) =>
      (types.length === 0 || types.includes(typeKey(a.asset_type))) &&
      (investability.length === 0 || investability.includes(a.investability)) &&
      (!q || a.name.toLowerCase().includes(q) || !!a.ticker?.toLowerCase().includes(q)),
  )
  const view = useTableView(filtered, SORT_VALUE)
  const clearFilters = () => {
    setTypes([])
    setInvestability([])
    view.setPage(1)
  }

  // No assets at all → "No Assets Yet", no footer. Assets hidden by filters/search → "No result found" with the footer.
  const none = assets.length === 0
  const empty = !loading && view.rows.length === 0

  return (
    <DataTable
      label="Assets"
      columns={COLUMNS}
      view={view}
      loading={loading}
      dimmed={dimmed}
      className={className}
      toolbarClassName="pt-6 pb-6"
      skeleton={Array.from({ length: 4 }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
      empty={
        !empty
          ? null
          : none
            ? { title: 'No Assets Yet', body: 'Once you create an asset, it will appear here' }
            : { title: 'No result found', body: 'We couldn’t find any result based on the filter' }
      }
      footer={!loading && !none}
      toolbarEnd={<TableSearch value={search} onChange={view.firstPage(setSearch)} label="Search assets" />}
      toolbarStart={
        <>
          <MultiFilterMenu label="Asset Type" options={ASSET_TYPE_FILTER_OPTIONS} values={types} onChange={view.firstPage(setTypes)} />
          <MultiFilterMenu
            label="Investability"
            options={INVESTABILITY_FILTER_OPTIONS}
            values={investability}
            onChange={view.firstPage(setInvestability)}
          />
          {(types.length > 0 || investability.length > 0) && (
            <Button variant="link" size="xs" onClick={clearFilters} className="ml-4 animate-rise px-0">
              Clear filter
            </Button>
          )}
        </>
      }
    >
      {view.rows.map((asset) => (
        <AssetRow
          key={asset.id}
          asset={asset}
          folders={folders}
          defaultFolderId={defaultFolderId}
          selected={view.isSelected(asset.id)}
          onSelect={(on) => view.toggle(asset.id, on)}
          onView={onView && (() => onView(asset))}
          onMove={onMove && ((folderId) => onMove(asset, folderId))}
          onAddRule={onAddRule && (() => onAddRule(asset))}
          onDelete={onDelete && (() => onDelete(asset))}
        />
      ))}
    </DataTable>
  )
}

function SkeletonRow() {
  return (
    <tr className="h-18" aria-hidden>
      <td className="pl-3 md:pl-4">
        <Skeleton className="size-4" />
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <Skeleton className="h-3 w-20" />
      </td>
      <td className="hidden md:table-cell">
        <Skeleton className="h-5.5 w-14 rounded-md" />
      </td>
      <td>
        <div className="flex flex-col items-end gap-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2.5 w-14" />
        </div>
      </td>
      <td />
    </tr>
  )
}
