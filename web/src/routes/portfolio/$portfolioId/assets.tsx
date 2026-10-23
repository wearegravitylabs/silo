import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ExportDialog } from '@/components/export-dialog'
import { toastDone } from '@/components/ui/sonner'
import {
  AssetsOverview,
  assetsOverviewQuery,
  assetsQuery,
  AssetsSummaryHeader,
  AssetTable,
  CreateAssetSheet,
  DeleteAssetDialog,
  useAssetMutations,
  useAssets,
  useAssetsOverview,
  type AssetItem,
} from '@/features/assets'
import { foldersQuery, FolderTabs, useFolders } from '@/features/folders'
import { usePortfolio } from '@/features/portfolios'
import { useAskSiloAi } from '@/features/silo-ai'
import { defaultFolderId } from '@/lib/folders'
import { AssetsSkeleton } from './-components/assets-skeleton'

interface AssetsSearch {
  /** Selected folder tab; defaults to the first folder */
  folder?: string
  /** Open the Create Asset sheet (e.g. from the dashboard's quick actions) */
  create?: boolean
}

const DEFAULT_FOLDER = defaultFolderId('asset')

export const Route = createFileRoute('/portfolio/$portfolioId/assets')({
  validateSearch: (search: Record<string, unknown>): AssetsSearch => ({
    ...(typeof search.folder === 'string' && { folder: search.folder }),
    ...(search.create === true && { create: true }),
  }),
  // Like debts: search is read from location (not loaderDeps) so switching folders keeps the page.
  loader: async ({ context: { queryClient }, params: { portfolioId }, location }) => {
    const [folders] = await Promise.all([
      queryClient.query({ ...foldersQuery(portfolioId, 'asset'), staleTime: 'static' }),
      queryClient.query({ ...assetsOverviewQuery(portfolioId), staleTime: 'static' }),
    ])
    const { folder } = location.search as AssetsSearch
    await queryClient.query({ ...assetsQuery(portfolioId, folder ?? folders[0]?.id ?? null), staleTime: 'static' })
  },
  pendingComponent: () => (
    <AssetsShell>
      <AssetsSkeleton />
    </AssetsShell>
  ),
  component: AssetsPage,
})

/** The page scrolls as a whole when the header, folder card and table don't fit; otherwise the table scrolls. */
function AssetsShell({ children }: { children: React.ReactNode }) {
  return <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
}

/** Folder tabs (folders feature) drive which assets (assets feature) are shown and summarised. */
function AssetsPage() {
  const { portfolioId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const portfolio = usePortfolio(portfolioId)
  const folders = useFolders(portfolioId, 'asset')
  const { currency } = useAssetsOverview(portfolioId)
  const { move, remove } = useAssetMutations(portfolioId)
  const ask = useAskSiloAi()
  const [exporting, setExporting] = useState(false)
  // Kept while the dialog animates closed.
  const [deleting, setDeleting] = useState<{ asset: AssetItem; open: boolean } | null>(null)

  const folder = folders.find((f) => f.id === search.folder) ?? folders[0]
  const folderId = folder?.id ?? null
  const { data: assets = [], isPending, isPlaceholderData } = useAssets(portfolioId, folderId)
  const setSearch = (patch: Partial<AssetsSearch>) => navigate({ search: (s) => ({ ...s, ...patch }), replace: true })
  const setFolder = (id: string) => setSearch({ folder: id })
  const setCreating = (create: boolean) => setSearch({ create: create || undefined })

  const moveAsset = (asset: AssetItem, to: string) =>
    move.mutate(
      { id: asset.id, folderId: to },
      {
        onSuccess: () => toast.success(`${asset.name} moved to ${folders.find((f) => f.id === to)?.name ?? 'the folder'}`),
        onError: () => toast.error('Couldn’t move this asset. Try again.'),
      },
    )

  const confirmDelete = () =>
    deleting &&
    remove.mutate(deleting.asset.id, {
      onSuccess: () => {
        setDeleting((d) => d && { ...d, open: false })
        toastDone('Asset has been deleted successfully')
      },
      onError: () => toast.error('Couldn’t delete this asset. Try again.'),
    })

  return (
    <AssetsShell>
      <AssetsSummaryHeader portfolioId={portfolioId} onExport={() => setExporting(true)} onCreate={() => setCreating(true)} />
      <FolderTabs
        folders={folders}
        selectedId={folderId}
        onSelect={setFolder}
        portfolioId={portfolioId}
        folderType="asset"
        onOrganize={() => ask('Organize my assets into folders')}
      >
        <AssetsOverview folderName={folder?.name ?? 'Assets'} assets={assets} currency={currency} loading={isPending} />
      </FolderTabs>
      {/* Keyed by folder so filters, search and selection start fresh in each folder. */}
      <AssetTable
        key={folderId}
        assets={assets}
        folders={folders}
        defaultFolderId={DEFAULT_FOLDER}
        loading={isPending}
        dimmed={isPlaceholderData}
        className="min-h-120"
        onMove={moveAsset}
        onDelete={(asset) => setDeleting({ asset, open: true })}
      />

      <DeleteAssetDialog
        open={!!deleting?.open}
        onOpenChange={(open) => setDeleting((d) => d && { ...d, open })}
        assetName={deleting?.asset.name ?? ''}
        pending={remove.isPending}
        onConfirm={confirmDelete}
      />
      <CreateAssetSheet
        portfolioId={portfolioId}
        folderId={folderId}
        defaultCurrency={portfolio.base_currency}
        open={!!search.create}
        onOpenChange={setCreating}
        onCreated={() => toast.success('Asset has been created successfully!')}
      />
      {/* TODO: generate the file once there's an export endpoint; UI only for now. */}
      <ExportDialog title="Export Asset" open={exporting} onOpenChange={setExporting} />
    </AssetsShell>
  )
}
