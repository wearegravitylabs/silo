import { DocumentsTabView } from '@/components/documents-tab-view'
import { downloadUrl } from '@/lib/download'
import { getAssetDocumentUrl } from '../../panel-api'
import { useAssetDocumentMutations, useAssetDocuments } from '../../panel-queries'
import type { AssetItem } from '../../types'

/** Documents tab: the asset's files (download, delete) and uploads in progress; upload with the button or by dropping. */
export function DocumentsTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const { data: documents, isPending } = useAssetDocuments(portfolioId, asset.id)
  const { uploads, upload, cancel, remove } = useAssetDocumentMutations(portfolioId, asset.id)
  return (
    <DocumentsTabView
      documents={documents}
      loading={isPending}
      uploads={uploads}
      onUpload={upload}
      onCancelUpload={cancel}
      onDownload={async (doc) => downloadUrl(await getAssetDocumentUrl(doc), doc.file_name)}
      onDelete={(id) => remove.mutate(id)}
    />
  )
}
