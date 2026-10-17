import { useState } from 'react'
import { FolderIcon, Trash2Icon } from 'lucide-react'
import { CurrencyFlag } from '@/components/currency-flag'
import { CloseIcon, DotsVerticalIcon } from '@/components/icons'
import { PanelTabs, Property, PropertyList } from '@/components/panel-layout'
import { Dialog, DialogClose, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SheetContent } from '@/components/ui/sheet'
import { formatDate, formatMoney } from '@/lib/format'
import { DEBT_TYPE_LABELS, FREQUENCY_LABELS } from '../../constants'
import { useDebtDocuments, useDebtNotes, useDebtRules } from '../../queries'
import type { Debt } from '../../types'
import { DebtIconDisc } from '../debt-icon-disc'
import { AutopilotTab } from './autopilot-tab'
import { DocumentsTab } from './documents-tab'
import { HistoryTab } from './history-tab'
import { NotesTab } from './notes-tab'

export type DebtPanelTab = 'history' | 'autopilot' | 'note' | 'documents'

/**
 * Right-hand detail panel for one debt: properties, then History, Auto-Pilot, Note and Documents tabs.
 * Render with key={debt.id} so the tab resets per debt. `addingRule` opens on Auto-Pilot with the rule dialog up.
 */
export function DebtPanel({
  debt,
  portfolioId,
  folderName,
  open,
  onOpenChange,
  initialTab = 'history',
  addingRule = false,
  onDelete,
}: {
  debt: Debt
  portfolioId: string
  folderName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: DebtPanelTab
  addingRule?: boolean
  /** Menu → Delete Debt */
  onDelete?: () => void
}) {
  const [tab, setTab] = useState<DebtPanelTab>(addingRule ? 'autopilot' : initialTab)
  const { data: rules } = useDebtRules(portfolioId, debt.id)
  const { data: notes } = useDebtNotes(portfolioId, debt.id)
  const { data: documents } = useDebtDocuments(portfolioId, debt.id)
  const tabProps = { debt, portfolioId }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" aria-describedby={undefined}>
        <div className="flex h-12 shrink-0 items-center justify-between px-4 sm:px-6">
          <DialogClose
            aria-label="Close panel"
            className="-ml-1 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <CloseIcon />
          </DialogClose>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`${debt.name} actions`}
              className="-mr-1 flex size-7 items-center justify-center rounded-lg outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40 aria-expanded:bg-accent"
            >
              <DotsVerticalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2Icon className="size-4" />
                Delete Debt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* One scroller below the top bar: properties scroll away, the tab bar sticks, each tab's CTA sticks to the bottom. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="shrink-0 px-4 pt-3 pb-5 sm:px-6">
            <DebtIconDisc debt={debt} />
            <DialogTitle className="mt-4 mb-4 font-heading text-2xl leading-8 font-bold">{debt.name}</DialogTitle>
            <PropertyList>
              <Property label="Debt Type">{DEBT_TYPE_LABELS[debt.debt_type] ?? debt.debt_type}</Property>
              <Property label="Currency">
                <span className="flex items-center gap-1.5">
                  <CurrencyFlag code={debt.currency} className="size-3.5" />
                  {debt.currency}
                </span>
              </Property>
              <Property label="Current Value">{formatMoney(debt.owned_balance, debt.currency)}</Property>
              <Property label="Payment Schedule">
                {debt.has_schedule && debt.frequency ? FREQUENCY_LABELS[debt.frequency] : 'None'}
              </Property>
              {folderName && (
                <Property label="Folder">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <FolderIcon className="size-4 shrink-0 fill-primary-dark text-primary-dark" aria-hidden />
                    <span className="truncate">{folderName}</span>
                  </span>
                </Property>
              )}
              <Property label="Last Updated">{formatDate(debt.updated_at)}</Property>
            </PropertyList>
          </div>

          <PanelTabs
            className="sticky top-0 z-10 bg-background"
            label={`${debt.name} sections`}
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'history', label: 'History' },
              { id: 'autopilot', label: 'Auto-Pilot', count: rules?.length },
              { id: 'note', label: 'Note', count: notes?.length },
              { id: 'documents', label: 'Documents', count: documents?.length },
            ]}
          />

          <div role="tabpanel" className="flex flex-1 flex-col">
            {tab === 'history' && <HistoryTab {...tabProps} />}
            {tab === 'autopilot' && <AutopilotTab {...tabProps} adding={addingRule} />}
            {tab === 'note' && <NotesTab {...tabProps} />}
            {tab === 'documents' && <DocumentsTab {...tabProps} />}
          </div>
        </div>
      </SheetContent>
    </Dialog>
  )
}
