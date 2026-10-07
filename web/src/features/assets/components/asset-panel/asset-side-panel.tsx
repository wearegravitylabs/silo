import { useState, type ReactNode } from 'react'
import { CloseIcon, DotsVerticalIcon } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { currencyFlag, formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { AutopilotTab } from '../../autopilot/components/autopilot-tab'
import { useRules } from '../../autopilot/queries'
import { ASSET_TYPE_LABELS } from '../../constants'
import { useAssetNotes } from '../../queries'
import type { AssetItem, FolderRef } from '../../types'
import { AssetLogo } from '../asset-logo'
import { DeleteAssetDialog } from './delete-asset-dialog'
import { DocumentsTab } from './documents-tab'
import { HistoryTab } from './history-tab'
import { MoveFolderDialog } from './move-folder-dialog'
import { NotesTab } from './notes-tab'
import { EyeOutlineIcon, MoveIcon, ReportIcon, TrashIcon } from './panel-icons'
import { ReportingTab } from './reporting-tab'

type PanelTab = 'history' | 'autopilot' | 'reporting' | 'note' | 'documents'

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'history', label: 'History' },
  { id: 'autopilot', label: 'Auto-Pilot' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'note', label: 'Note' },
  { id: 'documents', label: 'Documents' },
]

/**
 * Slide-in detail panel for one asset. Render with key={asset.id} so tab state
 * resets when a different asset is opened. Escape closes it.
 */
export function AssetSidePanel({
  asset,
  portfolioId,
  folders,
  allAssets,
  onClose,
}: {
  asset: AssetItem
  portfolioId: string
  folders: FolderRef[]
  allAssets?: AssetItem[]
  onClose: () => void
}) {
  const [tab, setTab] = useState<PanelTab>('history')
  const [dialog, setDialog] = useState<'move' | 'delete' | null>(null)

  // Tab-bar badges. Notes load once the Note tab has been opened.
  const { data: allRules } = useRules(portfolioId)
  const ruleCount = allRules?.filter((r) => r.target_id === asset.id).length ?? 0
  const { data: notes } = useAssetNotes(portfolioId, asset.id, { enabled: tab === 'note' })
  const folderName = folders.find((f) => f.id === asset.folder_id)?.name

  const tabProps = { asset, portfolioId }

  return (
    <>
      <aside
        aria-label={`${asset.name} details`}
        onKeyDown={(e) => e.key === 'Escape' && !dialog && onClose()}
        className="absolute top-0 right-0 z-20 flex h-full w-120.5 animate-slide-in-right flex-col bg-background shadow-sheet"
      >
        <div className="flex h-12 shrink-0 items-center justify-between px-6">
          <button
            type="button"
            aria-label="Close panel"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg hover:bg-accent"
          >
            <CloseIcon />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Asset actions"
              className="flex size-7 items-center justify-center rounded-lg outline-none hover:bg-accent aria-expanded:bg-accent"
            >
              <DotsVerticalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <EyeOutlineIcon />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog('move')}>
                <MoveIcon />
                Move to Folder
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTab('reporting')}>
                <ReportIcon />
                Report Asset
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDialog('delete')}>
                <TrashIcon className="size-4" />
                Delete Asset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="shrink-0 px-6 pt-5 pb-4">
          <div className="mb-4 flex flex-col gap-4">
            <AssetLogo asset={asset} className="size-10 bg-background p-2" />
            <h2 className="font-heading text-2xl leading-8 font-bold">{asset.name}</h2>
          </div>
          <dl className="flex flex-col gap-3">
            <Property label="Asset Type">{ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}</Property>
            {asset.ticker && <Property label="Ticker">{asset.ticker}</Property>}
            <Property label="Currency">
              <span className="flex items-center gap-1">
                <span className="text-base leading-none">{currencyFlag(asset.currency)}</span>
                {asset.currency}
              </span>
            </Property>
            <Property label="Current Value">{formatCurrency(asset.owned_value_converted, asset.converted_currency)}</Property>
            <Property label="Ownership">
              <span className="flex items-center gap-1">
                {asset.ownership_pct}%
                <span className="relative h-1 w-14 overflow-hidden rounded-full bg-primary-subtle">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-primary-dark"
                    style={{ width: `${Math.min(asset.ownership_pct, 100)}%` }}
                  />
                </span>
              </span>
            </Property>
            {folderName && <Property label="Folder">{folderName}</Property>}
            <Property label="Last Updated">{formatDate(asset.updated_at)}</Property>
          </dl>
        </div>

        <div role="tablist" aria-label="Asset sections" className="flex shrink-0 items-end gap-6 border-b px-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'group -mb-px flex h-10 items-center gap-1.5 border-b-2 py-2 font-medium whitespace-nowrap transition-colors',
                tab === t.id ? 'border-primary-dark text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              {t.id === 'autopilot' && ruleCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-subtle px-1 font-bold text-white group-aria-selected:bg-primary-dark">
                  {ruleCount}
                </span>
              )}
              {t.id === 'note' && !!notes?.length && (
                <span className="inline-flex h-5 min-w-4.5 items-center justify-center rounded-md border-[0.5px] border-line bg-accent px-1 text-xs text-foreground">
                  {notes.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content (each tab may add a pinned CTA strip) */}
        <div role="tabpanel" className="flex min-h-0 flex-1 flex-col">
          {tab === 'history' && <HistoryTab {...tabProps} />}
          {tab === 'autopilot' && <AutopilotTab {...tabProps} />}
          {tab === 'reporting' && <ReportingTab {...tabProps} />}
          {tab === 'note' && <NotesTab {...tabProps} />}
          {tab === 'documents' && <DocumentsTab {...tabProps} />}
        </div>
      </aside>

      <MoveFolderDialog
        asset={asset}
        portfolioId={portfolioId}
        folders={folders}
        allAssets={allAssets ?? []}
        open={dialog === 'move'}
        onOpenChange={(open) => setDialog(open ? 'move' : null)}
      />
      <DeleteAssetDialog
        asset={asset}
        portfolioId={portfolioId}
        open={dialog === 'delete'}
        onOpenChange={(open) => setDialog(open ? 'delete' : null)}
        onDeleted={onClose}
      />
    </>
  )
}

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 leading-5.5">
      <dt className="w-35 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  )
}
