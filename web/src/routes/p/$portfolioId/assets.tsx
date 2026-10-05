import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  AddAssetModal,
  assetOverviewQuery,
  AssetSidePanel,
  assetsQuery,
  AssetsOverview,
  AssetsSummaryHeader,
  AssetTable,
  useAssets,
  type AssetItem,
} from '@/features/assets'
import { foldersQuery, FolderTabs, useFolders } from '@/features/folders'
import { usePortfolio } from '@/features/portfolios'
import { AssetsSkeleton } from './-components/assets-skeleton'
import { MainPanel } from './-components/main-panel'
import { Topbar } from './-components/topbar'

interface AssetsSearch {
  /** Selected folder tab; defaults to the first folder */
  folder?: string
  /** Open the add-asset sheet (e.g. from the dashboard's quick actions) */
  create?: boolean
}

export const Route = createFileRoute('/p/$portfolioId/assets')({
  validateSearch: (search: Record<string, unknown>): AssetsSearch => ({
    ...(typeof search.folder === 'string' && { folder: search.folder }),
    ...(search.create === true && { create: true }),
  }),
  // Like the dashboard: search is read from location (not loaderDeps) so switching
  // folders keeps the page and the table shows the previous rows while loading.
  loader: async ({ context: { queryClient }, params: { portfolioId }, location }) => {
    const [folders] = await Promise.all([
      queryClient.ensureQueryData(foldersQuery(portfolioId, 'asset')),
      queryClient.ensureQueryData(assetOverviewQuery(portfolioId)),
    ])
    const { folder } = location.search as AssetsSearch
    const folderId = folder ?? folders[0]?.id ?? null
    await queryClient.ensureQueryData(assetsQuery(portfolioId, folderId))
  },
  pendingComponent: () => (
    <AssetsShell>
      <AssetsSkeleton />
    </AssetsShell>
  ),
  component: AssetsPage,
})

function AssetsShell({ children }: { children: React.ReactNode }) {
  const { portfolioId } = Route.useParams()
  return (
    <MainPanel>
      <Topbar portfolioId={portfolioId} actionLabel="Share" />
      {children}
    </MainPanel>
  )
}

/** Folder tabs (folders feature) drive which assets (assets feature) are shown. */
function AssetsPage() {
  const { portfolioId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const portfolio = usePortfolio(portfolioId)
  const folders = useFolders(portfolioId, 'asset')
  const [showCards, setShowCards] = useState(true)
  const [opened, setOpened] = useState<AssetItem | null>(null)

  const folderId = search.folder ?? folders[0]?.id ?? null
  const { data: assets = [], isPending, isPlaceholderData } = useAssets(portfolioId, folderId)
  // Portfolio-wide list, only for the "Move to folder" counts once a panel is open.
  const { data: allAssets } = useAssets(portfolioId, null, { enabled: !!opened })
  // Show the latest copy of the opened asset after edits.
  const selected = opened ? ((allAssets ?? assets).find((a) => a.id === opened.id) ?? opened) : null

  const setSearch = (patch: Partial<AssetsSearch>) => navigate({ search: (s) => ({ ...s, ...patch }), replace: true })
  const setCreating = (create: boolean) => setSearch({ create: create || undefined })

  return (
    <AssetsShell>
      <AssetsSummaryHeader portfolioId={portfolioId} currency={portfolio.base_currency} onCreate={() => setCreating(true)} />
      <FolderTabs
        folders={folders}
        selectedId={folderId}
        onSelect={(folder) => setSearch({ folder })}
        portfolioId={portfolioId}
        showCards={showCards}
        onToggleCards={() => setShowCards((v) => !v)}
      />
      {showCards && <AssetsOverview assets={assets} currency={portfolio.base_currency} loading={isPending} />}
      <AssetTable
        assets={assets}
        loading={isPending}
        dimmed={isPlaceholderData}
        onAddAsset={() => setCreating(true)}
        onOpenAsset={setOpened}
      />

      {selected && (
        <AssetSidePanel
          key={selected.id}
          asset={selected}
          portfolioId={portfolioId}
          folders={folders}
          allAssets={allAssets}
          onClose={() => setOpened(null)}
        />
      )}
      <AddAssetModal portfolioId={portfolioId} folderId={folderId} open={!!search.create} onOpenChange={setCreating} />
    </AssetsShell>
  )
}
