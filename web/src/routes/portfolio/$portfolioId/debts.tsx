import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ExportDialog } from '@/components/export-dialog'
import { toastDone } from '@/components/ui/sonner'
import {
  AddDebtSheet,
  DebtPanel,
  debtsOverviewQuery,
  debtsQuery,
  DebtsSummaryHeader,
  DebtTable,
  DeleteDebtDialog,
  useDebtFolderCounts,
  useDebts,
  useDeleteDebt,
  useRefileDebtFolder,
  type Debt,
} from '@/features/debts'
import { FolderFormDialog, foldersQuery, FolderTabs, useFolderMutations, useFolders } from '@/features/folders'
import { useAskSiloAi } from '@/features/silo-ai'
import { portfoliosQuery, usePortfolio } from '@/features/portfolios'
import { DebtsSkeleton } from './-components/debts-skeleton'

interface DebtsSearch {
  /** Selected folder tab; defaults to the first folder */
  folder?: string
  /** Open the Add Debt sheet; with no folder yet, Create Folder first */
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
      queryClient.query({ ...foldersQuery(portfolioId, 'debt'), staleTime: 'static' }),
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

/**
 * Folder tabs (folders feature) drive which debts (debts feature) are shown. Every debt is in a folder, so with none
 * yet, Add Debt asks for one first and then adds the debt to it.
 */
function DebtsPage() {
  const { portfolioId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const portfolio = usePortfolio(portfolioId)
  const folders = useFolders(portfolioId, 'debt')
  const counts = useDebtFolderCounts(portfolioId)
  const refile = useRefileDebtFolder(portfolioId)
  const remove = useDeleteDebt(portfolioId)
  const { create: createFolder } = useFolderMutations(portfolioId, 'debt')
  const ask = useAskSiloAi()
  const [exporting, setExporting] = useState(false)
  // The opened debt outlives `open` so the panel can animate closed; `n` gives each opening a fresh panel.
  const [panel, setPanel] = useState<{ id: string; addingRule: boolean; open: boolean; n: number } | null>(null)
  const openPanel = (id: string, addingRule: boolean) => setPanel((p) => ({ id, addingRule, open: true, n: (p?.n ?? 0) + 1 }))
  // Kept while the dialog closes.
  const [deleting, setDeleting] = useState<{ debt: Debt; open: boolean } | null>(null)

  const folderId = (folders.find((f) => f.id === search.folder) ?? folders[0])?.id ?? null
  const { data: debts = [], isPending, isPlaceholderData } = useDebts(portfolioId, folderId)
  const setSearch = (patch: Partial<DebtsSearch>) => navigate({ search: (s) => ({ ...s, ...patch }), replace: true })
  const setFolder = (folder: string) => setSearch({ folder })
  const setCreating = (create: boolean) => setSearch({ create: create || undefined })
  const opened = panel && debts.find((d) => d.id === panel.id)

  // Add Debt with no folder yet: the new folder is selected, which opens the sheet on it.
  const addFirstFolder = (values: { name: string; color: string }) =>
    createFolder.mutate(values, {
      onSuccess: (folder) => {
        setFolder(folder.id)
        toast.success('Folder has been created successfully!')
      },
      onError: () => toast.error('Couldn’t create the folder. Try again.'),
    })

  const confirmDelete = () =>
    deleting &&
    remove.mutate(deleting.debt.id, {
      onSuccess: () => {
        setDeleting((d) => d && { ...d, open: false })
        setPanel((p) => (p && p.id === deleting.debt.id ? { ...p, open: false } : p))
        toastDone('Debt has been deleted successfully!')
      },
      onError: () => toast.error('Couldn’t delete this debt. Try again.'),
    })

  return (
    <DebtsShell>
      <DebtsSummaryHeader
        portfolioId={portfolioId}
        currency={portfolio.base_currency}
        onExport={() => setExporting(true)}
        onAddDebt={() => setCreating(true)}
      />
      <FolderTabs
        folders={folders}
        selectedId={folderId}
        onSelect={setFolder}
        portfolioId={portfolioId}
        folderType="debt"
        onOrganize={() => ask('Organize my debts into folders')}
        counts={counts}
        onDeleted={(from, to) => to && refile.mutate({ from, to })}
      />
      {/* Keyed by folder so filters, search and selection start fresh in each folder. */}
      <DebtTable
        key={folderId}
        debts={debts}
        loading={isPending}
        dimmed={isPlaceholderData}
        noneMessage={folderId ? undefined : { title: 'No Folders Yet', body: 'Create a folder, then add your debts to it' }}
        onView={(debt) => openPanel(debt.id, false)}
        onAddRule={(debt) => openPanel(debt.id, true)}
        onDelete={(debt) => setDeleting({ debt, open: true })}
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
          onDelete={() => setDeleting({ debt: opened, open: true })}
        />
      )}
      <DeleteDebtDialog
        open={!!deleting?.open}
        onOpenChange={(open) => setDeleting((d) => d && { ...d, open })}
        debtName={deleting?.debt.name ?? ''}
        pending={remove.isPending}
        onConfirm={confirmDelete}
      />
      <FolderFormDialog
        hint="Debts are kept in folders. Create one for this debt first."
        open={!!search.create && !folderId}
        onOpenChange={setCreating}
        onSave={addFirstFolder}
        saving={createFolder.isPending}
      />
      <AddDebtSheet
        portfolioId={portfolioId}
        folderId={folderId}
        defaultCurrency={portfolio.base_currency}
        open={!!search.create && !!folderId}
        onOpenChange={setCreating}
        onAdded={() => toast.success('Debt has been added successfully!')}
      />
      {/* TODO: generate the file once there's an export endpoint; UI only for now. */}
      <ExportDialog title="Export Debt" open={exporting} onOpenChange={setExporting} />
    </DebtsShell>
  )
}
