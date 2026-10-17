import { ChevronDownIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Previous/Next at the ends: flat grey, like the design (not the faded secondary gradient).
const pager =
  'not-aria-busy:disabled:bg-accent not-aria-busy:disabled:bg-none not-aria-busy:disabled:text-subtle not-aria-busy:disabled:opacity-100 disabled:shadow-none'

/** Table footer: "Showing 1 to 10 of 42 results", rows-per-page menu, Previous / Next. `page` is 1-based. */
export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizes = [10, 25, 50],
  className,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizes?: number[]
  className?: string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className={cn('flex min-h-13 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2 md:px-4', className)}>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing {from} to {to} of {total} {total === 1 ? 'result' : 'results'}
      </p>
      <div className="flex items-center gap-3 md:gap-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="xs" className="gap-1.5 font-medium" aria-label={`${pageSize} rows per page`}>
              {pageSize} per page
              <ChevronDownIcon className="size-2.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-28">
            {pageSizes.map((size) => (
              <DropdownMenuItem
                key={size}
                role="menuitemradio"
                aria-checked={size === pageSize}
                onSelect={() => onPageSizeChange(size)}
                className={cn(size === pageSize && 'bg-accent')}
              >
                {size} per page
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <nav className="flex items-center gap-2" aria-label="Pagination">
          <Button variant="secondary" size="xs" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className={pager}>
            Previous
          </Button>
          <Button variant="secondary" size="xs" disabled={page >= pages} onClick={() => onPageChange(page + 1)} className={pager}>
            Next
          </Button>
        </nav>
      </div>
    </div>
  )
}
