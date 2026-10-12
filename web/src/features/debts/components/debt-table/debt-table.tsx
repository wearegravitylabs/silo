import { useState } from 'react'
import { FilterMenu, type FilterOption } from '@/components/filter-menu'
import { SortIcon } from '@/components/icons'
import { SearchInput } from '@/components/search-input'
import { TablePagination } from '@/components/table-pagination'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { DEBT_TYPE_LABELS, FREQUENCY_LABELS } from '../../constants'
import type { Debt } from '../../types'
import { DebtRow } from './debt-row'

type SortKey = 'name' | 'schedule' | 'change' | 'value'
type Sort = { key: SortKey; dir: 'asc' | 'desc' } | null

const NO_SCHEDULE = 'none'

// Payment Schedule and 1M drop out on small screens; Debt and Value always show.
const COLUMNS: { key: SortKey; label: string; align?: 'right'; hideOnMobile?: boolean }[] = [
  { key: 'name', label: 'Debt' },
  { key: 'schedule', label: 'Payment Schedule', hideOnMobile: true },
  { key: 'change', label: '1M', hideOnMobile: true },
  { key: 'value', label: 'Value', align: 'right' },
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
 * Any change to filters, search, sort or page size goes back to page 1. Select-all covers the rows on the current page.
 */
export function DebtTable({ debts, loading, dimmed }: { debts: Debt[]; loading?: boolean; dimmed?: boolean }) {
  const [type, setTypeState] = useState<string | null>(null)
  const [schedule, setScheduleState] = useState<string | null>(null)
  const [search, setSearchState] = useState('')
  const [sort, setSortState] = useState<Sort>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(10)

  const firstPage =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value)
      setPage(1)
    }
  const setType = firstPage(setTypeState)
  const setSchedule = firstPage(setScheduleState)
  const setSearch = firstPage(setSearchState)
  const setPageSize = firstPage(setPageSizeState)

  const q = search.trim().toLowerCase()
  const filtered = debts.filter(
    (d) =>
      (!type || d.debt_type === type) &&
      (!schedule || (schedule === NO_SCHEDULE ? !d.has_schedule : d.has_schedule && d.frequency === schedule)) &&
      (!q || d.name.toLowerCase().includes(q)),
  )
  const sorted = sort ? sortBy(filtered, sort) : filtered
  // Clamp: a shrinking list (e.g. after a refetch) can leave the page past the end.
  const current = Math.min(page, Math.max(1, Math.ceil(sorted.length / pageSize)))
  const rows = sorted.slice((current - 1) * pageSize, current * pageSize)

  const typeOptions: FilterOption[] = [
    { label: 'All Types', value: null },
    ...[...new Set(debts.map((d) => d.debt_type))].map((t) => ({ label: DEBT_TYPE_LABELS[t] ?? t, value: t })),
  ]
  const frequencies = [...new Set(debts.flatMap((d) => (d.has_schedule && d.frequency ? [d.frequency] : [])))]
  const scheduleOptions: FilterOption[] = [
    { label: 'All Schedules', value: null },
    ...frequencies.map((f) => ({ label: FREQUENCY_LABELS[f], value: f })),
    { label: 'No Schedule', value: NO_SCHEDULE },
  ]

  const selectedCount = rows.filter((d) => selected.has(d.id)).length
  const allChecked = rows.length > 0 && selectedCount === rows.length ? true : selectedCount > 0 ? 'indeterminate' : false
  const toggleAll = () => setSelected(allChecked === true ? new Set() : new Set(rows.map((d) => d.id)))
  const toggleOne = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const cycleSort = (key: SortKey) => {
    setSortState((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null))
    setPage(1)
  }

  const empty = !loading && rows.length === 0

  return (
    <section className="mx-4 mb-6 flex min-h-0 flex-1 flex-col md:mx-10 md:mb-10" aria-label="Debts">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 py-4">
        <div className="flex items-center gap-2">
          <FilterMenu label="Debt Type" value={type} onChange={setType} options={typeOptions} />
          <FilterMenu label="Payment Schedule" value={schedule} onChange={setSchedule} options={scheduleOptions} />
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          label="Search debts"
          placeholder="Search.."
          className="w-full bg-accent md:w-100"
        />
      </div>

      <div
        className={cn('flex min-h-0 flex-col rounded-2xl border border-border bg-surface transition-opacity', dimmed && 'opacity-60')}
        aria-busy={loading || dimmed}
      >
        <div className="min-h-0 overflow-y-auto">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <colgroup>
              <col className="w-12 md:w-16" />
              <col />
              <col className="hidden w-60 md:table-column" />
              <col className="hidden w-30 md:table-column" />
              <col className="w-32 md:w-36" />
              <col className="w-12 md:w-17" />
            </colgroup>
            <thead className="sticky top-0 z-1 bg-surface">
              <tr className="h-12 text-left text-xs font-medium text-muted-foreground">
                <th className="pl-3 font-medium md:pl-4">
                  <Checkbox checked={allChecked} onCheckedChange={toggleAll} disabled={empty} aria-label="Select all debts" />
                </th>
                {COLUMNS.map(({ key, label, align, hideOnMobile }) => (
                  <th
                    key={key}
                    aria-sort={sort?.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn('font-medium', align === 'right' && 'text-right', hideOnMobile && 'hidden md:table-cell')}
                  >
                    <button
                      type="button"
                      onClick={() => cycleSort(key)}
                      className="inline-flex items-center gap-1.5 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      {label}
                      <SortIcon className={cn('size-2.5', sort?.key === key && 'text-muted-foreground')} />
                    </button>
                  </th>
                ))}
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            {/* The rows sit on a white inset panel; the grey ground shows around it. */}
            {!empty && (
              <tbody className="bg-card [&>tr+tr>td]:border-t [&>tr+tr>td]:border-border [&>tr:first-child>td:first-child]:rounded-tl-xl [&>tr:first-child>td:last-child]:rounded-tr-xl [&>tr:last-child>td:first-child]:rounded-bl-xl [&>tr:last-child>td:last-child]:rounded-br-xl">
                {loading
                  ? Array.from({ length: 4 }, (_, i) => <SkeletonRow key={i} />)
                  : rows.map((debt) => (
                      <DebtRow key={debt.id} debt={debt} selected={selected.has(debt.id)} onSelect={(on) => toggleOne(debt.id, on)} />
                    ))}
              </tbody>
            )}
          </table>

          {empty && (
            <div className="flex min-h-92 animate-rise flex-col items-center justify-center gap-1.5 rounded-xl bg-card px-6 text-center shadow-small">
              <p className="font-medium text-foreground">{debts.length === 0 ? 'No Debts Yet' : 'No Debts Found'}</p>
              <p className="text-xs leading-5 text-muted-foreground">
                {debts.length === 0 ? 'Once you create a debt, it will appear here' : 'Try adjusting your filters or search'}
              </p>
            </div>
          )}
        </div>
        {!empty && !loading && (
          <TablePagination page={current} pageSize={pageSize} total={sorted.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
        )}
      </div>
    </section>
  )
}

function sortBy(list: Debt[], { key, dir }: NonNullable<Sort>) {
  const value = SORT_VALUE[key]
  return [...list].sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    if (va == null || vb == null) return va == null ? (vb == null ? 0 : 1) : -1
    const order = va < vb ? -1 : va > vb ? 1 : 0
    return dir === 'asc' ? order : -order
  })
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
