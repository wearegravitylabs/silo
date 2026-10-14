import { useState } from 'react'
import { DataTable, useTableView, type DataColumn } from '@/components/data-table'
import { MultiFilterMenu, type MultiFilterOption } from '@/components/multi-filter-menu'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DEBT_TYPE_FILTER_OPTIONS, FREQUENCY_LABELS, NO_SCHEDULE, SCHEDULE_FILTER_BASE } from '../../constants'
import type { Debt, PaymentFrequency } from '../../types'
import { DebtRow } from './debt-row'

type SortKey = 'name' | 'schedule' | 'change' | 'value'

// Payment Schedule and 1M drop out on small screens; Debt and Value always show.
const COLUMNS: DataColumn<SortKey>[] = [
  { key: 'name', label: 'Debt' },
  { key: 'schedule', label: 'Payment Schedule', hideOnMobile: true, width: 'w-60' },
  { key: 'change', label: '1M', hideOnMobile: true, width: 'w-30' },
  { key: 'value', label: 'Value', align: 'right', width: 'w-32 md:w-36' },
]

/** Sort value per column; rows without a value (no schedule, no 1M change) sink to the bottom either way. */
const SORT_VALUE: Record<SortKey, (d: Debt) => string | number | null> = {
  name: (d) => d.name.toLowerCase(),
  schedule: (d) => (d.has_schedule && d.frequency ? FREQUENCY_LABELS[d.frequency] : null),
  change: (d) => d.change_pct_1m,
  value: (d) => d.owned_balance,
}

/**
 * Filterable, sortable, paginated debt list for one folder. `loading` shows skeleton rows; `dimmed` while another folder loads.
 * Any change to filters, search, sort or page size goes back to page 1.
 */
export function DebtTable({
  debts,
  loading,
  dimmed,
  onView,
  onAddRule,
}: {
  debts: Debt[]
  loading?: boolean
  dimmed?: boolean
  /** Row menu → View details */
  onView?: (debt: Debt) => void
  /** Row menu → Add Auto-pilot */
  onAddRule?: (debt: Debt) => void
}) {
  const [types, setTypes] = useState<string[]>([])
  const [schedules, setSchedules] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const q = search.trim().toLowerCase()
  const filtered = debts.filter(
    (d) =>
      (types.length === 0 || types.includes(d.debt_type)) &&
      (schedules.length === 0 || schedules.includes(d.has_schedule && d.frequency ? d.frequency : NO_SCHEDULE)) &&
      (!q || d.name.toLowerCase().includes(q)),
  )
  const view = useTableView(filtered, SORT_VALUE)
  const clearFilters = () => {
    setTypes([])
    setSchedules([])
    view.setPage(1)
  }

  // The usual frequencies always; others (bi-weekly, quarterly…) once a debt uses them.
  const used = new Set(debts.flatMap((d) => (d.has_schedule && d.frequency ? [d.frequency] : [])))
  const scheduleOptions: MultiFilterOption[] = [
    ...(Object.keys(FREQUENCY_LABELS) as PaymentFrequency[])
      .filter((f) => SCHEDULE_FILTER_BASE.includes(f) || used.has(f))
      .map((f) => ({ value: f, label: FREQUENCY_LABELS[f] })),
    { value: NO_SCHEDULE, label: 'No Schedule' },
  ]

  // No debts at all → "No Debts Yet", no footer. Debts hidden by filters/search → "No result found" with the footer.
  const none = debts.length === 0
  const empty = !loading && view.rows.length === 0

  return (
    <DataTable
      label="Debts"
      columns={COLUMNS}
      view={view}
      search={search}
      onSearch={view.firstPage(setSearch)}
      loading={loading}
      dimmed={dimmed}
      skeleton={Array.from({ length: 4 }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
      empty={
        !empty
          ? null
          : none
            ? { title: 'No Debts Yet', body: 'Once you create a debt, it will appear here' }
            : { title: 'No result found', body: 'We couldn’t find any result based on the filter' }
      }
      footer={!loading && !none}
      filters={
        <>
          <MultiFilterMenu label="Debt Type" options={DEBT_TYPE_FILTER_OPTIONS} values={types} onChange={view.firstPage(setTypes)} />
          <MultiFilterMenu label="Payment Schedule" options={scheduleOptions} values={schedules} onChange={view.firstPage(setSchedules)} />
          {(types.length > 0 || schedules.length > 0) && (
            <Button variant="link" size="xs" onClick={clearFilters} className="ml-4 animate-rise px-0">
              Clear filter
            </Button>
          )}
        </>
      }
    >
      {view.rows.map((debt) => (
        <DebtRow
          key={debt.id}
          debt={debt}
          selected={view.isSelected(debt.id)}
          onSelect={(on) => view.toggle(debt.id, on)}
          onView={onView && (() => onView(debt))}
          onAddRule={onAddRule && (() => onAddRule(debt))}
        />
      ))}
    </DataTable>
  )
}

function SkeletonRow() {
  return (
    <tr className="h-18" aria-hidden>
      <td className="pl-3 md:pl-4">
        <Skeleton className="size-4" />
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <Skeleton className="h-3 w-16" />
      </td>
      <td className="hidden md:table-cell" />
      <td>
        <div className="flex flex-col items-end gap-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-2.5 w-14" />
        </div>
      </td>
      <td />
    </tr>
  )
}
