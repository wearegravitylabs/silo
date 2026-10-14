import { useState, type ReactNode } from 'react'
import { SortIcon } from '@/components/icons'
import { SearchInput } from '@/components/search-input'
import { TablePagination } from '@/components/table-pagination'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

// The list pages' table (Debts, Vault): filters + search above a grey card holding a sortable header,
// white inset rows, an empty state and the pagination footer. Rows are each page's own <tr>s.

export type SortDir = 'asc' | 'desc'
export type Sort<K extends string> = { key: K; dir: SortDir } | null

export interface DataColumn<K extends string> {
  key: K
  label: string
  align?: 'right'
  /** Dropped below md (the row must hide its cell too). */
  hideOnMobile?: boolean
  /** Width classes for the <col>, e.g. "w-60" */
  width?: string
}

/**
 * Sort, select and paginate already-filtered rows. Clicking a header cycles asc → desc → off.
 * `firstPage(setter)` wraps a filter/search setter so changing it goes back to page 1. Select-all covers the current page.
 */
export function useTableView<T extends { id: string }, K extends string>(
  rows: T[],
  sortValue: Record<K, (row: T) => string | number | null>,
) {
  const [sort, setSort] = useState<Sort<K>>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(10)

  const firstPage =
    <V,>(set: (value: V) => void) =>
    (value: V) => {
      set(value)
      setPage(1)
    }

  const sorted = sort ? sortBy(rows, sortValue[sort.key], sort.dir) : rows
  // Clamp: a shrinking list (e.g. after a refetch or delete) can leave the page past the end.
  const current = Math.min(page, Math.max(1, Math.ceil(sorted.length / pageSize)))
  const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize)

  const selectedCount = pageRows.filter((r) => selected.has(r.id)).length
  const allChecked: boolean | 'indeterminate' =
    pageRows.length > 0 && selectedCount === pageRows.length ? true : selectedCount > 0 ? 'indeterminate' : false

  return {
    rows: pageRows,
    total: sorted.length,
    sort,
    cycleSort: (key: K) => {
      setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null))
      setPage(1)
    },
    page: current,
    pageSize,
    setPage,
    setPageSize: firstPage(setPageSizeState),
    firstPage,
    allChecked,
    toggleAll: () => setSelected(allChecked === true ? new Set() : new Set(pageRows.map((r) => r.id))),
    isSelected: (id: string) => selected.has(id),
    toggle: (id: string, on: boolean) =>
      setSelected((prev) => {
        const next = new Set(prev)
        if (on) next.add(id)
        else next.delete(id)
        return next
      }),
  }
}

export type TableView<K extends string> = ReturnType<typeof useTableView<{ id: string }, K>>

/** Rows without a value sink to the bottom in either direction. */
function sortBy<T>(list: T[], value: (row: T) => string | number | null, dir: SortDir) {
  return [...list].sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    if (va == null || vb == null) return va == null ? (vb == null ? 0 : 1) : -1
    const order = va < vb ? -1 : va > vb ? 1 : 0
    return dir === 'asc' ? order : -order
  })
}

/**
 * Filter bar + table card. `empty` replaces the rows (and fills the card) when there are none to show;
 * `footer` shows the pagination. `loading` renders `skeleton` rows; `dimmed` fades the card while other data loads.
 */
export function DataTable<K extends string>({
  label,
  columns,
  view,
  toolbarStart,
  toolbarEnd,
  selectHeader,
  loading,
  dimmed,
  skeleton,
  empty,
  footer,
  toolbarClassName,
  children,
}: {
  /** Plural noun for the table and its controls, e.g. "Debts" */
  label: string
  columns: DataColumn<K>[]
  view: TableView<K>
  /** Toolbar, left and right (e.g. filters | <TableSearch>) */
  toolbarStart?: ReactNode
  toolbarEnd?: ReactNode
  /** Replaces the header's select-all checkbox (e.g. a toggle-all switch) */
  selectHeader?: ReactNode
  loading?: boolean
  dimmed?: boolean
  skeleton: ReactNode
  empty: { title: string; body: string } | null
  footer: boolean
  toolbarClassName?: string
  children: ReactNode
}) {
  const noun = label.toLowerCase()

  return (
    <section className="mx-4 mb-6 flex min-h-0 flex-1 flex-col md:mx-10 md:mb-10" aria-label={label}>
      <div className={cn('flex shrink-0 flex-wrap items-center justify-between gap-2 py-4', toolbarClassName)}>
        <div className="flex items-center gap-2 max-md:w-full">{toolbarStart}</div>
        <div className="flex items-center gap-2 max-md:w-full">{toolbarEnd}</div>
      </div>

      <div
        className={cn(
          'flex min-h-0 flex-col rounded-2xl border border-border bg-surface transition-opacity',
          empty && 'flex-1',
          dimmed && 'opacity-60',
        )}
        aria-busy={loading || dimmed}
      >
        <div className={cn('flex min-h-0 flex-col overflow-y-auto', empty && 'flex-1')}>
          <table className="w-full table-fixed border-separate border-spacing-0">
            <colgroup>
              <col className="w-12 md:w-16" />
              {columns.map((c) => (
                <col key={c.key} className={cn(c.width, c.hideOnMobile && 'hidden md:table-column')} />
              ))}
              <col className="w-12 md:w-17" />
            </colgroup>
            <thead className="sticky top-0 z-1 bg-surface">
              <tr className="h-12 text-left text-xs font-medium text-muted-foreground">
                <th className="pl-3 font-medium md:pl-4">
                  {selectHeader ?? (
                    <Checkbox
                      checked={view.allChecked}
                      onCheckedChange={view.toggleAll}
                      disabled={!!empty}
                      aria-label={`Select all ${noun}`}
                    />
                  )}
                </th>
                {columns.map(({ key, label, align, hideOnMobile }) => (
                  <th
                    key={key}
                    aria-sort={view.sort?.key === key ? (view.sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn('font-medium', align === 'right' && 'text-right', hideOnMobile && 'hidden md:table-cell')}
                  >
                    <button
                      type="button"
                      onClick={() => view.cycleSort(key)}
                      className="inline-flex items-center gap-1.5 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      {label}
                      <SortIcon className={cn('size-2.5', view.sort?.key === key && 'text-muted-foreground')} />
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
                {loading ? skeleton : children}
              </tbody>
            )}
          </table>

          {empty && (
            <div className="flex min-h-92 flex-1 animate-rise flex-col items-center justify-center gap-1.5 rounded-xl bg-card px-6 text-center shadow-small">
              <p className="font-medium text-foreground">{empty.title}</p>
              <p className="text-xs leading-5 text-muted-foreground">{empty.body}</p>
            </div>
          )}
        </div>
        {footer && (
          <TablePagination
            page={view.page}
            pageSize={view.pageSize}
            total={view.total}
            onPageChange={view.setPage}
            onPageSizeChange={view.setPageSize}
          />
        )}
      </div>
    </section>
  )
}

/** The table's search box: full width on mobile, 400px from md. */
export function TableSearch({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return <SearchInput value={value} onChange={onChange} label={label} placeholder="Search.." className="w-full bg-accent md:w-100" />
}

/** Row checkbox cell, matching the header's select-all column. */
export function SelectCell({ checked, onChange, label }: { checked: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <td className="pl-3 md:pl-4">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} aria-label={label} />
    </td>
  )
}
