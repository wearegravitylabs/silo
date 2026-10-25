import { useRef, useState } from 'react'
import { DownloadIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { FileTypeIcon } from '@/components/file-type-icon'
import { DotsIcon } from '@/components/icons'
import { TabBody, TabCta, TabEmpty, TabListSkeleton } from '@/components/panel-layout'
import { ProgressLine } from '@/components/progress-line'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toastDone } from '@/components/ui/sonner'
import { formatFileSizeShort } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface PanelDocument {
  id: string
  file_name: string
  file_size: number
}

/** A file still uploading: its share done so far (0–1). */
export interface PendingUpload {
  id: string
  file_name: string
  file_size: number
  progress: number
}

/**
 * Documents tab of a detail panel (asset, debt): the files (⋯ download, or delete after a confirm) and any uploads in
 * progress (with a bar; trash cancels), with toasts. Upload with the button or by dropping files on the tab. The
 * caller owns the data.
 */
export function DocumentsTabView({
  documents,
  loading,
  uploads = [],
  uploading,
  onUpload,
  onDownload,
  onDelete,
  deletePending,
  onCancelUpload,
}: {
  documents: PanelDocument[] | undefined
  loading: boolean
  uploads?: PendingUpload[]
  /** Spinner on the button (when uploads aren't listed) */
  uploading?: boolean
  onUpload: (file: File) => void
  /** Starts the download; reject to show the error toast */
  onDownload: (doc: PanelDocument) => Promise<void>
  /** Call `done` once it's deleted */
  onDelete: (docId: string, done: () => void) => void
  deletePending?: boolean
  onCancelUpload?: (uploadId: string) => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const uploadAll = (files: FileList | null) => Array.from(files ?? []).forEach(onUpload)
  const empty = !documents?.length && !uploads.length
  // Kept while the confirm closes.
  const [deleting, setDeleting] = useState<{ id: string; open: boolean } | null>(null)

  const download = async (doc: PanelDocument) => {
    try {
      await onDownload(doc)
      toast.success('Document has started downloading')
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <div
      className="flex flex-1 flex-col"
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        uploadAll(e.dataTransfer.files)
      }}
    >
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          uploadAll(e.target.files)
          e.target.value = ''
        }}
      />
      <TabBody className={cn('overflow-y-visible transition-colors', dragging && 'bg-primary-subtle/60')}>
        {loading ? (
          <TabListSkeleton rows={1} className="h-20" />
        ) : empty ? (
          <TabEmpty title="No Document Yet" body="Drag and drop or Click upload button to upload a document" bodyClassName="max-w-56" />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {uploads.map((up) => (
              <li key={up.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-4">
                <div className="flex items-center gap-3">
                  <FileTypeIcon fileName={up.file_name} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-medium text-foreground">{up.file_name}</span>
                    <span className="text-xs leading-4 text-muted-foreground">
                      {formatFileSizeShort(up.file_size)} · {Math.round(up.progress * 100)}%
                    </span>
                  </div>
                  {onCancelUpload && (
                    <IconButton label={`Cancel uploading ${up.file_name}`} danger onClick={() => onCancelUpload(up.id)}>
                      <Trash2Icon className="size-4" />
                    </IconButton>
                  )}
                </div>
                <ProgressLine value={up.progress} label={`Uploading ${up.file_name}`} className="h-1 rounded-full [&>div]:rounded-full" />
              </li>
            ))}
            {documents?.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-4">
                <FileTypeIcon fileName={doc.file_name} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-medium text-foreground">{doc.file_name}</span>
                  <span className="text-xs leading-4 text-muted-foreground">{formatFileSizeShort(doc.file_size)}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={`${doc.file_name} options`}
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-subtle outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40 aria-expanded:bg-accent"
                  >
                    <DotsIcon className="text-current" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={() => download(doc)}>
                      <DownloadIcon className="size-4" />
                      Download Document
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDeleting({ id: doc.id, open: true })}>
                      <Trash2Icon className="size-4" />
                      Delete Document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </TabBody>

      <TabCta floating>
        <Button onClick={() => fileInput.current?.click()} loading={uploading} loadingText="Uploading…">
          <UploadIcon className="size-3.5" aria-hidden />
          Upload Document
        </Button>
      </TabCta>

      <ConfirmDialog
        open={!!deleting?.open}
        onOpenChange={(open) => setDeleting((d) => d && { ...d, open })}
        title="Delete Document"
        confirmLabel="Delete Document"
        cancelLabel="Close"
        pending={deletePending}
        onConfirm={() =>
          deleting &&
          onDelete(deleting.id, () => {
            setDeleting((d) => d && { ...d, open: false })
            toastDone('Document has been deleted successfully!')
          })
        }
      >
        You’re about to delete this document. This means that this Document will be permanently removed. This action cannot be undone
      </ConfirmDialog>
    </div>
  )
}

function IconButton({
  label,
  danger,
  onClick,
  children,
}: {
  label: string
  danger?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex shrink-0 rounded-sm text-subtle transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        danger ? 'hover:text-destructive' : 'hover:text-muted-foreground',
      )}
    >
      {children}
    </button>
  )
}
