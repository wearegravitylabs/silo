import { useState } from 'react'
import { ChevronRightIcon } from 'lucide-react'
import { DataTable, SelectCell, TableSearch, useTableView, type DataColumn } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDayMonthYear, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { INVOICE_STATUS, invoiceStatus } from '../lib'
import type { Invoice } from '../types'

type SortKey = 'invoice' | 'amount' | 'status'

// Amount drops out on small screens (the panel shows it).
const COLUMNS: DataColumn<SortKey>[] = [
  { key: 'invoice', label: 'Invoice' },
  { key: 'amount', label: 'Amount', hideOnMobile: true },
  { key: 'status', label: 'Status' },
]

const SORT_VALUE: Record<SortKey, (i: Invoice) => string | number | null> = {
  invoice: (i) => i.due_date,
  amount: (i) => i.amount,
  status: (i) => INVOICE_STATUS[invoiceStatus(i)].label,
}

const amount = (i: Invoice) => formatMoney(i.amount, i.currency, { spaced: false, decimals: 0 })
const dueDate = (i: Invoice) => formatDayMonthYear(i.due_date, { comma: true })

/** Search box over the invoice list (plan, date, number, status); a row opens its invoice. */
export function InvoicesTable({
  invoices,
  loading,
  onOpen,
}: {
  invoices: Invoice[]
  loading?: boolean
  onOpen: (invoice: Invoice) => void
}) {
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const filtered = invoices.filter(
    (i) =>
      !q || [i.plan_name, i.number, dueDate(i), amount(i), INVOICE_STATUS[invoiceStatus(i)].label].some((t) => t.toLowerCase().includes(q)),
  )
  const view = useTableView(filtered, SORT_VALUE)
  const empty =
    loading || view.rows.length
      ? null
      : invoices.length
        ? { title: 'No result found', body: 'We couldn’t find an invoice matching your search' }
        : { title: 'No invoices yet', body: 'Once there’s an invoice, it will appear here' }

  return (
    <DataTable
      label="Invoices"
      columns={COLUMNS}
      view={view}
      loading={loading}
      className="mx-0 mb-0 flex-none md:mx-0 md:mb-0"
      toolbarClassName="pt-0 pb-6"
      skeleton={Array.from({ length: 3 }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
      empty={empty}
      footer={!loading && invoices.length > 0}
      toolbarStart={<TableSearch value={search} onChange={view.firstPage(setSearch)} label="Search invoices" />}
    >
      {view.rows.map((invoice) => (
        <InvoiceRow
          key={invoice.id}
          invoice={invoice}
          selected={view.isSelected(invoice.id)}
          onSelect={(on) => view.toggle(invoice.id, on)}
          onOpen={() => onOpen(invoice)}
        />
      ))}
    </DataTable>
  )
}

/** 72px row: plan over due date, amount, status chip, chevron. Clicking anywhere but the checkbox opens it. */
function InvoiceRow({
  invoice,
  selected,
  onSelect,
  onOpen,
}: {
  invoice: Invoice
  selected: boolean
  onSelect: (selected: boolean) => void
  onOpen: () => void
}) {
  const status = INVOICE_STATUS[invoiceStatus(invoice)]
  return (
    <tr
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('button, [role="checkbox"]')) onOpen()
      }}
      className={cn('h-18 cursor-pointer transition-colors hover:bg-surface', selected && 'bg-surface')}
    >
      <SelectCell checked={selected} onChange={onSelect} label={`Select ${invoice.plan_name}, ${dueDate(invoice)}`} />
      <td>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate leading-5.5 text-foreground">{invoice.plan_name}</span>
          <span className="truncate text-xs leading-4 text-muted-foreground">{dueDate(invoice)}</span>
        </div>
      </td>
      <td className="hidden truncate text-foreground md:table-cell">{amount(invoice)}</td>
      <td>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </td>
      <td className="pr-3 text-right md:pr-4">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`View ${invoice.plan_name} invoice, ${dueDate(invoice)}`}
          className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </td>
    </tr>
  )
}

function SkeletonRow() {
  return (
    <tr className="h-18" aria-hidden>
      <td className="pl-3 md:pl-4">
        <Skeleton className="size-4" />
      </td>
      <td>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </td>
      <td className="hidden md:table-cell">
        <Skeleton className="h-3 w-16" />
      </td>
      <td>
        <Skeleton className="h-5 w-14" />
      </td>
      <td />
    </tr>
  )
}
