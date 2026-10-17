import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ExportDialog } from '@/components/export-dialog'
import {
  AddDebtSheet,
  DebtPanel,
  debtFoldersQuery,
  debtsOverviewQuery,
  debtsQuery,
  DebtsSummaryHeader,
  DebtTable,
  useDebtFolders,
  useDebts,
} from '@/features/debts'
import { FolderTabs } from '@/features/folders'
import { portfoliosQuery, usePortfolio } from '@/features/portfolios'
import { DebtsSkeleton } from './-components/debts-skeleton'

interface DebtsSearch {
  /** Selected folder tab; defaults to the first folder */
  folder?: string
  /** Open the Add Debt sheet */
  create?: boolean
}

export const Route = createFileRoute('/portfolio/$portfolioId/debts')({
  validateSearch: (search: Record<string, unknown>): DebtsSearch => ({
    ...(typeof search.folder === 'string' && { folder: search.folder }),
    ...(search.create === true && { create: true }),
  }),
  // Like assets: search is read from location (not loaderDeps) so switching folders keeps the page.
  loader: async ({ context: { queryClient }, params: { portfolioId }, location }) => {
    // Portfolios are already cached by the parent route; the overview needs the base currency.
    const [folders, portfolios] = await Promise.all([
      queryClient.query({ ...debtFoldersQuery(portfolioId), staleTime: 'static' }),
      queryClient.query({ ...portfoliosQuery, staleTime: 'static' }),
    ])
    const currency = portfolios.find((p) => p.id === portfolioId)?.base_currency ?? 'USD'
    const { folder } = location.search as DebtsSearch
    const folderId = folder ?? folders[0]?.id ?? null
    await Promise.all([
      queryClient.query({ ...debtsOverviewQuery(portfolioId, currency), staleTime: 'static' }),
      queryClient.query({ ...debtsQuery(portfolioId, folderId), staleTime: 'static' }),
    ])
  },
  pendingComponent: () => (
    <DebtsShell>
      <DebtsSkeleton />
    </DebtsShell>
  ),
  component: DebtsPage,
})

/** Debts fill the shell's content area and manage their own scrolling. */
function DebtsShell({ children }: { children: React.ReactNode }) {
  return <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
}

/** Folder tabs (folders feature) drive which debts (debts feature) are shown. */
function DebtsPage() {
  const { portfolioId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const portfolio = usePortfolio(portfolioId)
  const folders = useDebtFolders(portfolioId)
  const [exporting, setExporting] = useState(false)
  // The opened debt outlives `open` so the panel can animate closed; `n` gives each opening a fresh panel.
  const [panel, setPanel] = useState<{ id: string; addingRule: boolean; open: boolean; n: number } | null>(null)
  const openPanel = (id: string, addingRule: boolean) => setPanel((p) => ({ id, addingRule, open: true, n: (p?.n ?? 0) + 1 }))

  const folderId = search.folder ?? folders[0]?.id ?? null
  const { data: debts = [], isPending, isPlaceholderData } = useDebts(portfolioId, folderId)
  const setSearch = (patch: Partial<DebtsSearch>) => navigate({ search: (s) => ({ ...s, ...patch }), replace: true })
  const setFolder = (folder: string) => setSearch({ folder })
  const setCreating = (create: boolean) => setSearch({ create: create || undefined })
  const opened = panel && debts.find((d) => d.id === panel.id)

  return (
    <DebtsShell>
      <DebtsSummaryHeader
        portfolioId={portfolioId}
        currency={portfolio.base_currency}
        onExport={() => setExporting(true)}
        onAddDebt={() => setCreating(true)}
      />
      <FolderTabs folders={folders} selectedId={folderId} onSelect={setFolder} portfolioId={portfolioId} folderType="debt" />
      {/* Keyed by folder so filters, search and selection start fresh in each folder. */}
      <DebtTable
        key={folderId}
        debts={debts}
        loading={isPending}
        dimmed={isPlaceholderData}
        onView={(debt) => openPanel(debt.id, false)}
        onAddRule={(debt) => openPanel(debt.id, true)}
      />
      {panel && opened && (
        <DebtPanel
          key={panel.n}
          debt={opened}
          portfolioId={portfolioId}
          folderName={folders.find((f) => f.id === (opened.folder_id ?? folderId))?.name}
          open={panel.open}
          onOpenChange={(open) => setPanel((p) => p && { ...p, open })}
          addingRule={panel.addingRule}
        />
      )}
      <AddDebtSheet portfolioId={portfolioId} folderId={folderId} open={!!search.create} onOpenChange={setCreating} />
      {/* TODO: generate the file once there's an export endpoint; UI only for now. */}
      <ExportDialog title="Export Debt" open={exporting} onOpenChange={setExporting} />
    </DebtsShell>
  )
}
