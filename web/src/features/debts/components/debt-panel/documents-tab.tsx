import { useRef, useState } from 'react'
import { DownloadIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { FileTypeIcon } from '@/components/file-type-icon'
import { TabBody, TabCta, TabEmpty, TabListSkeleton } from '@/components/panel-layout'
import { Button } from '@/components/ui/button'
import { downloadUrl } from '@/lib/download'
import { formatFileSizeShort } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getDebtDocumentUrl } from '../../api'
import { useDebtDocumentMutations, useDebtDocuments } from '../../queries'
import type { Debt, DebtDocument } from '../../types'

/** Documents tab: the debt's files (download, delete); upload with the button or by dropping files on the tab. */
export function DocumentsTab({ debt, portfolioId }: { debt: Debt; portfolioId: string }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const { data: documents, isPending } = useDebtDocuments(portfolioId, debt.id)
  const { upload, remove } = useDebtDocumentMutations(portfolioId, debt.id)

  const uploadAll = (files: FileList | null) => Array.from(files ?? []).forEach((file) => upload.mutate(file))

  const download = async (doc: DebtDocument) => downloadUrl(await getDebtDocumentUrl(doc), doc.file_name)

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
        {isPending ? (
          <TabListSkeleton rows={1} className="h-20" />
        ) : !documents?.length ? (
          <TabEmpty title="No Document Yet" body="Drag and drop or Click upload button to upload a document" bodyClassName="max-w-56" />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-4">
                <FileTypeIcon fileName={doc.file_name} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-medium text-foreground">{doc.file_name}</span>
                  <span className="text-xs leading-4 text-muted-foreground">{formatFileSizeShort(doc.file_size)}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-subtle">
                  <button
                    type="button"
                    aria-label={`Download ${doc.file_name}`}
                    onClick={() => download(doc)}
                    className="flex rounded-sm transition-colors outline-none hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <DownloadIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${doc.file_name}`}
                    onClick={() => remove.mutate(doc.id)}
                    className="flex rounded-sm transition-colors outline-none hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </TabBody>

      <TabCta floating>
        <Button onClick={() => fileInput.current?.click()} loading={upload.isPending} loadingText="Uploading…">
          <UploadIcon className="size-3.5" aria-hidden />
          Upload Document
        </Button>
      </TabCta>
    </div>
  )
}
