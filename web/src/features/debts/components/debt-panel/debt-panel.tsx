import { useState } from 'react'
import { FolderIcon, Trash2Icon } from 'lucide-react'
import { CurrencyFlag } from '@/components/currency-flag'
import { DetailPanel } from '@/components/detail-panel'
import { Property, PropertyList } from '@/components/panel-layout'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
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
    <DetailPanel
      open={open}
      onOpenChange={onOpenChange}
      title={debt.name}
      disc={<DebtIconDisc debt={debt} />}
      menu={
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2Icon className="size-4" />
          Delete Debt
        </DropdownMenuItem>
      }
      properties={
        <PropertyList>
          <Property label="Debt Type">{DEBT_TYPE_LABELS[debt.debt_type] ?? debt.debt_type}</Property>
          <Property label="Currency">
            <span className="flex items-center gap-1.5">
              <CurrencyFlag code={debt.currency} className="size-3.5" />
              {debt.currency}
            </span>
          </Property>
          <Property label="Current Value">{formatMoney(debt.owned_balance, debt.currency)}</Property>
          <Property label="Payment Schedule">{debt.has_schedule && debt.frequency ? FREQUENCY_LABELS[debt.frequency] : 'None'}</Property>
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
      }
      tabs={[
        { id: 'history', label: 'History' },
        { id: 'autopilot', label: 'Auto-Pilot', count: rules?.length },
        { id: 'note', label: 'Note', count: notes?.length },
        { id: 'documents', label: 'Documents', count: documents?.length },
      ]}
      tab={tab}
      onTabChange={setTab}
    >
      {tab === 'history' && <HistoryTab {...tabProps} />}
      {tab === 'autopilot' && <AutopilotTab {...tabProps} adding={addingRule} />}
      {tab === 'note' && <NotesTab {...tabProps} />}
      {tab === 'documents' && <DocumentsTab {...tabProps} />}
    </DetailPanel>
  )
}
