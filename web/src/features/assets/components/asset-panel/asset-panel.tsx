import { useState } from 'react'
import { FolderIcon, Trash2Icon } from 'lucide-react'
import { CurrencyFlag } from '@/components/currency-flag'
import { DetailPanel } from '@/components/detail-panel'
import { FolderGlyph } from '@/components/folder-glyph'
import { Property, PropertyList } from '@/components/panel-layout'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Tooltip } from '@/components/ui/tooltip'
import { formatDate, formatMoney } from '@/lib/format'
import { ASSET_TYPE_LABELS } from '../../constants'
import { useAssetDocuments, useAssetNotes, useAssetRules } from '../../panel-queries'
import type { AssetItem } from '../../types'
import { AssetIconDisc } from '../asset-icon-disc'
import { AutopilotTab } from './autopilot-tab'
import { DocumentsTab } from './documents-tab'
import { HistoryTab } from './history-tab'
import { NotesTab } from './notes-tab'
import { ReportingTab } from './reporting-tab'

export type AssetPanelTab = 'history' | 'autopilot' | 'reporting' | 'note' | 'documents'

/**
 * Right-hand detail panel for one asset: properties (type, ticker, currency, value, allocation, ownership, folder),
 * then History, Auto-Pilot, Reporting, Note and Documents. Render with key={asset.id} so the tab resets per asset.
 */
export function AssetPanel({
  asset,
  portfolioId,
  folder,
  owner,
  portfolioTotal,
  open,
  onOpenChange,
  onMove,
  onDelete,
}: {
  asset: AssetItem
  portfolioId: string
  /** The folder it's filed in, with its colour */
  folder?: { name: string; color: string }
  /** Who owns the share (the portfolio owner) */
  owner: { name: string; avatar_url: string | null }
  /** Everything the portfolio owns, for Allocation */
  portfolioTotal: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onMove?: () => void
  onDelete?: () => void
}) {
  const [tab, setTab] = useState<AssetPanelTab>('history')
  const { data: rules } = useAssetRules(portfolioId, asset.id)
  const { data: notes } = useAssetNotes(portfolioId, asset.id)
  const { data: documents } = useAssetDocuments(portfolioId, asset.id)
  const currency = asset.converted_currency
  const value = formatMoney(asset.owned_value_converted, currency)
  const allocation = portfolioTotal > 0 ? (asset.owned_value_converted / portfolioTotal) * 100 : 0
  const tabProps = { asset, portfolioId }

  return (
    <DetailPanel
      open={open}
      onOpenChange={onOpenChange}
      title={asset.name}
      disc={<AssetIconDisc asset={asset} />}
      menu={
        <>
          <DropdownMenuItem onSelect={onMove} disabled={!onMove}>
            <FolderIcon className="size-4" />
            Move Folders
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={onDelete} disabled={!onDelete}>
            <Trash2Icon className="size-4" />
            Delete Asset
          </DropdownMenuItem>
        </>
      }
      properties={
        <PropertyList>
          <Property label="Asset Type">{ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}</Property>
          {asset.ticker && <Property label="Ticker">{asset.ticker}</Property>}
          <Property label="Currency">
            <span className="flex items-center gap-1.5">
              <CurrencyFlag code={currency} className="size-3.5" />
              {currency}
            </span>
          </Property>
          <Property label="Current Value">{value}</Property>
          <Property label="Allocation">
            <span className="flex items-center gap-2">
              {Number(allocation.toFixed(allocation < 1 && allocation > 0 ? 1 : 0))}%
              <span
                role="meter"
                aria-label="Share of the portfolio"
                aria-valuenow={Math.round(allocation)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-0.75 w-14 overflow-hidden rounded-full bg-primary-subtle"
              >
                <span className="block h-full min-w-0.75 rounded-full bg-primary-dark" style={{ width: `${allocation}%` }} />
              </span>
            </span>
          </Property>
          <Property label="Ownership">
            <Tooltip
              side="top"
              className="flex flex-col items-center px-2.5 py-1.5"
              content={
                <>
                  <span className="font-medium">{owner.name}</span>
                  <span className="text-[0.6875rem] leading-4 text-white/70">
                    {Number(asset.ownership_pct.toFixed(2))}% · {value}
                  </span>
                </>
              }
            >
              <button
                type="button"
                aria-label={`${owner.name} owns ${asset.ownership_pct}%`}
                className="flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <Avatar name={owner.name} src={owner.avatar_url} className="size-5 text-[0.625rem]" />
              </button>
            </Tooltip>
          </Property>
          {folder && (
            <Property label="Folder">
              <span className="flex min-w-0 items-center gap-1.5">
                <FolderGlyph className="size-4" style={{ color: folder.color }} />
                <span className="truncate">{folder.name}</span>
              </span>
            </Property>
          )}
          <Property label="Last Updated">{formatDate(asset.updated_at)}</Property>
        </PropertyList>
      }
      tabs={[
        { id: 'history', label: 'History' },
        { id: 'autopilot', label: 'Auto-Pilot', count: rules?.length },
        { id: 'reporting', label: 'Reporting' },
        { id: 'note', label: 'Note', count: notes?.length },
        { id: 'documents', label: 'Documents', count: documents?.length },
      ]}
      tab={tab}
      onTabChange={setTab}
    >
      {tab === 'history' && <HistoryTab {...tabProps} />}
      {tab === 'autopilot' && <AutopilotTab {...tabProps} />}
      {tab === 'reporting' && <ReportingTab {...tabProps} />}
      {tab === 'note' && <NotesTab {...tabProps} />}
      {tab === 'documents' && <DocumentsTab {...tabProps} />}
    </DetailPanel>
  )
}
