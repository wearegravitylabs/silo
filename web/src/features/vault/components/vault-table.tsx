import { useState } from 'react'
import { DownloadIcon, Trash2Icon } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DataTable, TableSearch, SelectCell, useTableView, type DataColumn } from '@/components/data-table'
import { FileTypeIcon } from '@/components/file-type-icon'
import { DotsIcon } from '@/components/icons'
import { MultiFilterMenu } from '@/components/multi-filter-menu'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { downloadUrl } from '@/lib/download'
import { formatFileSizeShort } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getVaultDocumentUrl } from '../api'
import { documentTitle, documentType } from '../constants'
import { useVaultDocumentMutations } from '../queries'
import type { VaultDocument } from '../types'

type SortKey = 'name' | 'type'

// Document Type drops out on small screens; the file glyph still shows the type.
const COLUMNS: DataColumn<SortKey>[] = [
  { key: 'name', label: 'Document' },
  { key: 'type', label: 'Document Type', hideOnMobile: true, width: 'w-5/12' },
]

const SORT_VALUE: Record<SortKey, (d: VaultDocument) => string> = {
  name: (d) => d.file_name.toLowerCase(),
  type: (d) => documentType(d.file_name),
}

/** The vault's documents: type filter, search, sort, pagination; each row downloads or deletes (after confirming). */
export function VaultTable({ portfolioId, documents, loading }: { portfolioId: string; documents: VaultDocument[]; loading?: boolean }) {
  const [types, setTypes] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<VaultDocument | null>(null)
  const { remove } = useVaultDocumentMutations(portfolioId)

  const q = search.trim().toLowerCase()
  const filtered = documents.filter(
    (d) => (types.length === 0 || types.includes(documentType(d.file_name))) && (!q || d.file_name.toLowerCase().includes(q)),
  )
  const view = useTableView(filtered, SORT_VALUE)
  const typeOptions = [...new Set(documents.map((d) => documentType(d.file_name)))].sort().map((t) => ({ value: t, label: t }))

  const none = documents.length === 0
  const empty = !loading && view.rows.length === 0

  return (
    <>
      <DataTable
        label="Documents"
        columns={COLUMNS}
        view={view}
        loading={loading}
        skeleton={Array.from({ length: 4 }, (_, i) => (
          <SkeletonRow key={i} />
        ))}
        empty={
          !empty
            ? null
            : none
              ? { title: 'No Documents Yet', body: 'Once you upload a document, it will appear here' }
              : { title: 'No result found', body: 'We couldn’t find any result based on the filter' }
        }
        footer={!loading && !none}
        toolbarClassName="py-6"
        toolbarEnd={<TableSearch value={search} onChange={view.firstPage(setSearch)} label="Search documents" />}
        toolbarStart={<MultiFilterMenu label="Document Type" options={typeOptions} values={types} onChange={view.firstPage(setTypes)} />}
      >
        {view.rows.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            selected={view.isSelected(doc.id)}
            onSelect={(on) => view.toggle(doc.id, on)}
            onDelete={() => setDeleting(doc)}
          />
        ))}
      </DataTable>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete Document"
        cancelLabel="Close"
        confirmLabel="Delete Document"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      >
        You’re about to delete this document from your vault. This action cannot be undone
      </ConfirmDialog>
    </>
  )
}

/** 72px row: file glyph, title and size, type, ⋯ menu (Download, Delete). Shaded while selected or its menu is open. */
function DocumentRow({
  doc,
  selected,
  onSelect,
  onDelete,
}: {
  doc: VaultDocument
  selected: boolean
  onSelect: (on: boolean) => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const title = documentTitle(doc.file_name)

  return (
    <tr className={cn('h-18 transition-colors', (menuOpen || selected) && 'bg-surface')}>
      <SelectCell checked={selected} onChange={onSelect} label={`Select ${title}`} />
      <td>
        <div className="flex min-w-0 items-center gap-2">
          <FileTypeIcon fileName={doc.file_name} />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium text-foreground">{title}</span>
            <span className="text-xs leading-4 text-muted-foreground">{formatFileSizeShort(doc.file_size, { spaced: true })}</span>
          </div>
        </div>
      </td>
      <td className="hidden text-foreground md:table-cell">{documentType(doc.file_name)}</td>
      <td className="pr-3 text-right md:pr-4">
        <DropdownMenu onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label={`${title} options`}>
              <DotsIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-50">
            <DropdownMenuItem onSelect={async () => downloadUrl(await getVaultDocumentUrl(doc), doc.file_name)}>
              <DownloadIcon className="size-4" />
              Download Document
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon className="size-4" />
              Delete Document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-8 rounded-md" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <Skeleton className="h-3 w-10" />
      </td>
      <td />
    </tr>
  )
}
