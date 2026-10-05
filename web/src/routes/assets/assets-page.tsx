import { useState } from 'react'
import {
  AddAssetModal,
  AssetSidePanel,
  AssetTable,
  AssetsOverview,
  AssetsSummaryHeader,
  useAssets,
  type AssetItem,
} from '@/features/assets'
import { FolderTabs, useFolders } from '@/features/folders'
import { useCurrentPortfolio } from '@/features/portfolios'
import { MainPanel } from '../app-layout/main-panel'
import { Topbar } from '../app-layout/topbar'

/** Assets screen: folder tabs (folders feature) drive which assets (assets feature) are shown. */
export function AssetsPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [pickedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [showCards, setShowCards] = useState(true)
  const [openedAsset, setOpenedAsset] = useState<AssetItem | null>(null)

  const { portfolio } = useCurrentPortfolio()
  const portfolioId = portfolio?.id ?? ''
  const currency = portfolio?.base_currency ?? 'USD'

  const { data: folders } = useFolders(portfolioId, 'asset')
  // Default to the first folder until the user picks one
  const selectedFolderId = pickedFolderId ?? folders?.[0]?.id ?? null

  // Scoped server-side to the selected folder
  const { data: assets, isLoading: loadingAssets } = useAssets(portfolioId, selectedFolderId)
  const folderAssets = assets ?? []

  // Unscoped list — only the "Move to folder" modal needs it (per-folder counts),
  // so fetch it once an asset panel is open.
  const { data: allAssets } = useAssets(portfolioId, null, { enabled: !!openedAsset })

  // Show the latest copy of the opened asset after edits; fall back to the clicked row.
  const selectedAsset = openedAsset
    ? (allAssets ?? folderAssets).find((a) => a.id === openedAsset.id) ?? openedAsset
    : null

  return (
    <MainPanel>
      <Topbar actionLabel="Share" />

      <AssetsSummaryHeader
        portfolioId={portfolioId}
        currency={currency}
        folderAssets={folderAssets}
        canCreate={!!portfolioId}
        onCreate={() => setShowAddModal(true)}
      />

      {folders && (
        <FolderTabs
          folders={folders}
          selectedId={selectedFolderId}
          onSelect={setSelectedFolderId}
          portfolioId={portfolioId}
          onFolderCreated={setSelectedFolderId}
          showCards={showCards}
          onToggleCards={() => setShowCards((v) => !v)}
        />
      )}

      <AssetsOverview assets={folderAssets} currency={currency} loading={loadingAssets && !assets} showCards={showCards} />

      <AssetTable
        assets={folderAssets}
        loading={loadingAssets && !assets}
        onAddAsset={() => setShowAddModal(true)}
        onOpenPanel={setOpenedAsset}
      />

      {selectedAsset && (
        <AssetSidePanel
          key={selectedAsset.id}
          asset={selectedAsset}
          portfolioId={portfolioId}
          folders={folders}
          allAssets={allAssets}
          onClose={() => setOpenedAsset(null)}
        />
      )}

      {showAddModal && (
        <AddAssetModal
          portfolioId={portfolioId}
          folderId={selectedFolderId ?? ''}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </MainPanel>
  )
}
