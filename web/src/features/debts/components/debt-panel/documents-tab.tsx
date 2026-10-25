import { DocumentsTabView } from '@/components/documents-tab-view'
import { downloadUrl } from '@/lib/download'
import { getDebtDocumentUrl } from '../../api'
import { useDebtDocumentMutations, useDebtDocuments } from '../../queries'
import type { Debt } from '../../types'

/** Documents tab: the debt's files (download, delete); upload with the button or by dropping files on the tab. */
export function DocumentsTab({ debt, portfolioId }: { debt: Debt; portfolioId: string }) {
  const { data: documents, isPending } = useDebtDocuments(portfolioId, debt.id)
  const { upload, remove } = useDebtDocumentMutations(portfolioId, debt.id)
  return (
    <DocumentsTabView
      documents={documents}
      loading={isPending}
      uploading={upload.isPending}
      onUpload={(file) => upload.mutate(file)}
      onDownload={async (doc) => downloadUrl(await getDebtDocumentUrl(doc), doc.file_name)}
      onDelete={(id) => remove.mutate(id)}
    />
  )
}
