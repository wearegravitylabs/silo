import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { formatDate, formatFileSize } from '@/lib/format'
import { getDocumentDownloadUrl } from '../../api'
import { useAssetDocuments, useDocumentMutations } from '../../queries'
import type { AssetDocument, AssetItem } from '../../types'
import { DownloadIcon, FileIcon, TrashIcon, UploadIcon } from './panel-icons'
import { TabBody, TabCta, TabEmpty, TabListSkeleton } from './tab-layout'

/** Documents tab: upload, download and delete files attached to this asset. */
export function DocumentsTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const { data: documents, isPending } = useAssetDocuments(portfolioId, asset.id)
  const { upload, remove } = useDocumentMutations(portfolioId, asset.id)

  // Download URLs are short-lived presigned links, so fetch one per click.
  const download = async (doc: AssetDocument) => {
    const { url } = await getDocumentDownloadUrl(portfolioId, asset.id, doc.id)
    window.open(url, '_blank', 'noopener')
  }

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload.mutate(file)
          e.target.value = ''
        }}
      />
      <TabBody>
        {isPending ? (
          <TabListSkeleton rows={2} className="h-14" />
        ) : !documents?.length ? (
          <TabEmpty title="No documents added" body="Upload documents related to this asset for easy access." />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2.5 bg-surface px-3.5 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <FileIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{doc.file_name}</p>
                  <p className="mt-px text-subtle">
                    {formatFileSize(doc.file_size)} · {formatDate(doc.uploaded_at)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label={`Download ${doc.file_name}`}
                    onClick={() => download(doc)}
                    className="flex size-6.5 items-center justify-center rounded-md bg-accent hover:opacity-80"
                  >
                    <DownloadIcon />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${doc.file_name}`}
                    onClick={() => remove.mutate(doc.id)}
                    className="flex size-6.5 items-center justify-center rounded-md bg-destructive-subtle hover:opacity-80"
                  >
                    <TrashIcon className="size-3 text-destructive" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </TabBody>
      <TabCta>
        <Button onClick={() => fileInput.current?.click()} disabled={upload.isPending}>
          <UploadIcon />
          {upload.isPending ? 'Uploading…' : 'Upload Document'}
        </Button>
      </TabCta>
    </>
  )
}
