import { useState } from 'react'
import { CloseIcon, DotsIcon, SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ASSET_TYPE_LABELS } from '../../constants'
import type { AssetItem } from '../../types'
import { AssetLogo } from '../asset-logo'
import { ChangeBadge } from '../change-badge'
import { SortIcon } from '../icons'
import { FilterMenu } from './filter-menu'

const INVESTABILITY = [
  { label: 'All', value: null },
  { label: 'Investable', value: 'investable' },
  { label: 'Non-Investable', value: 'non_investable' },
]

/** Filterable asset list. `loading` shows skeleton rows; `dimmed` while another folder loads. */
export function AssetTable({
  assets,
  loading,
  dimmed,
  onAddAsset,
  onOpenAsset,
}: {
  assets: AssetItem[]
  loading?: boolean
  dimmed?: boolean
  onAddAsset: () => void
  onOpenAsset: (asset: AssetItem) => void
}) {
  const [type, setType] = useState<string | null>(null)
  const [investability, setInvestability] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const q = search.trim().toLowerCase()
  const rows = assets.filter(
    (a) =>
      (!type || a.asset_type === type) &&
      (!investability || (investability === 'investable') === (a.investability === 'investable')) &&
      (!q || a.name.toLowerCase().includes(q) || a.ticker?.toLowerCase().includes(q)),
  )
  const types = [...new Set(assets.map((a) => a.asset_type))]

  return (
    <section className="mx-10 mb-10 flex min-h-0 flex-1 flex-col" aria-label="Assets">
      <div className="flex shrink-0 items-center justify-between gap-2 py-4">
        <div className="flex items-center gap-2">
          <FilterMenu
            label="Asset Type"
            value={type}
            onChange={setType}
            options={[{ label: 'All Types', value: null }, ...types.map((t) => ({ label: ASSET_TYPE_LABELS[t] ?? t, value: t }))]}
          />
          <FilterMenu label="Investability" value={investability} onChange={setInvestability} options={INVESTABILITY} />
        </div>
        <label className="flex h-8 w-60 items-center gap-2 rounded-lg border bg-surface px-3 focus-within:border-primary">
          <SearchIcon className="size-3.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            aria-label="Search assets"
            className="flex-1 bg-transparent outline-none placeholder:text-subtle"
          />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => setSearch('')} className="flex">
              <CloseIcon className="size-3" />
            </button>
          )}
        </label>
      </div>

      <Card className={cn('flex flex-1 flex-col transition-opacity', dimmed && 'opacity-60')} aria-busy={loading || dimmed}>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-11" />
              <col />
              <col className="w-35" />
              <col className="w-25" />
              <col className="w-40" />
              <col className="w-12" />
            </colgroup>
            <thead className="sticky top-0 z-1 bg-card">
              <tr className="h-10 border-b text-left font-medium tracking-[0.5px] text-muted-foreground uppercase">
                <th className="pl-4">
                  <input type="checkbox" aria-label="Select all assets" className="cursor-pointer align-middle" />
                </th>
                {['Asset', 'Type', '1M'].map((label) => (
                  <th key={label} className="font-medium">
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <SortIcon />
                    </span>
                  </th>
                ))}
                <th className="text-right font-medium">
                  <span className="inline-flex items-center gap-1">
                    Value
                    <SortIcon />
                  </span>
                </th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading
                ? Array.from({ length: 4 }, (_, i) => <SkeletonRow key={i} />)
                : rows.map((asset) => <AssetRow key={asset.id} asset={asset} onOpen={() => onOpenAsset(asset)} />)}
            </tbody>
          </table>

          {!loading && rows.length === 0 && (
            <div className="flex animate-rise flex-col items-center justify-center gap-4 px-10 py-12">
              <div className="flex size-12 items-center justify-center rounded-xl bg-accent">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-6 text-primary-dark">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    fill="currentColor"
                    opacity="0.25"
                    d="M3 6a2 2 0 0 1 2-2h4.586L11 5.414A2 2 0 0 0 12.414 6H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"
                  />
                  <path d="M12 9v6M9 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex flex-col gap-1 text-center">
                <p className="font-heading font-bold">No assets found</p>
                <p className="text-muted-foreground">
                  {assets.length === 0 ? 'Add your first asset to get started' : 'Try adjusting your filters'}
                </p>
              </div>
              {assets.length === 0 && (
                <Button onClick={onAddAsset} className="px-4">
                  <PlusIcon />
                  Create Asset
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </section>
  )
}

function AssetRow({ asset, onOpen }: { asset: AssetItem; onOpen: () => void }) {
  return (
    <tr className="h-15">
      <td className="pl-4">
        <input type="checkbox" aria-label={`Select ${asset.name}`} className="cursor-pointer align-middle" />
      </td>
      <td>
        <div className="flex min-w-0 items-center gap-3">
          <AssetLogo asset={asset} />
          <div className="flex min-w-0 flex-col gap-px">
            <span className="truncate font-semibold">{asset.name}</span>
            {asset.ticker && <span className="text-subtle">{asset.ticker}</span>}
          </div>
        </div>
      </td>
      <td className="text-muted-foreground">{ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}</td>
      <td>
        <ChangeBadge pct={asset.change_pct} />
      </td>
      <td className="text-right">
        <div className="font-semibold">{formatCurrency(asset.owned_value_converted, asset.converted_currency)}</div>
        {asset.total_quantity != null && asset.ticker && (
          <div className="text-subtle">
            {asset.total_quantity.toLocaleString()} {asset.ticker}
          </div>
        )}
      </td>
      <td className="pr-4 text-right">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open ${asset.name}`}
          className="inline-flex size-6 items-center justify-center rounded-md transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <DotsIcon />
        </button>
      </td>
    </tr>
  )
}

function SkeletonRow() {
  return (
    <tr className="h-15" aria-hidden>
      <td className="pl-4">
        <Skeleton className="size-3.5" />
      </td>
      <td>
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        </div>
      </td>
      <td>
        <Skeleton className="h-3 w-14" />
      </td>
      <td>
        <Skeleton className="h-5.5 w-14 rounded-md" />
      </td>
      <td>
        <div className="flex flex-col items-end gap-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2.5 w-12" />
        </div>
      </td>
      <td />
    </tr>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className="size-3">
      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
