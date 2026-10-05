import { useRef } from 'react'
import { formatDate, formatFileSize } from '@/lib/format'
import { getDocumentDownloadUrl } from '../../api'
import { useAssetDocuments, useDocumentMutations } from '../../queries'
import type { AssetDocument, AssetItem } from '../../types'
import { TabBody, TabCta, TabEmpty } from './tab-layout'

/** Documents tab: upload, download and delete files attached to this asset. */
export function DocumentsTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const docFileRef = useRef<HTMLInputElement>(null)
  const { data: documents } = useAssetDocuments(portfolioId, asset.id)
  const { upload, remove } = useDocumentMutations(portfolioId, asset.id)
  const uploadingDoc = upload.isPending

  // Download URLs are short-lived presigned links, so fetch one per click.
  const handleDownload = async (doc: AssetDocument) => {
    const { url } = await getDocumentDownloadUrl(portfolioId, asset.id, doc.id)
    window.open(url, '_blank')
  }

  return (
    <>
      <TabBody>
        <>
          <input ref={docFileRef} type="file" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { upload.mutate(f); if (docFileRef.current) docFileRef.current.value = '' } }} />
          {documents?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {documents.map((doc: AssetDocument) => (
                <div key={doc.id} style={{ background: '#F9F9FB', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF0F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8 2H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V5L8 2z" stroke="#6E738C" strokeWidth="1.2" strokeLinejoin="round"/><path d="M8 2v3h3" stroke="#6E738C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#2C2E35', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</div>
                    <div style={{ fontSize: '11px', color: '#B3B8CB', marginTop: '1px' }}>{formatFileSize(doc.file_size)} · {formatDate(doc.uploaded_at)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button type="button" onClick={() => handleDownload(doc)}
                      style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: '#EFF0F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v6M4 6l2 2 2-2" stroke="#6E738C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10h8" stroke="#6E738C" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    </button>
                    <button type="button" onClick={() => remove.mutate(doc.id)}
                      style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: '#FFF0EE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4 3V2h4v1M5 5.5v3M7 5.5v3M3 3l.5 7h5l.5-7H3z" stroke="#F03722" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <TabEmpty title="No documents added" body="Upload documents related to this asset for easy access." />
          )}
        </>
      </TabBody>
      <TabCta>
        <button type="button" onClick={() => docFileRef.current?.click()} disabled={uploadingDoc}
          style={{ height: '32px', padding: '0 12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: uploadingDoc ? 0.7 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 9V4M5 6l2-2 2 2" stroke="#FFF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.5 11h9" stroke="#FFF" strokeWidth="1.3" strokeLinecap="round"/></svg>
          {uploadingDoc ? 'Uploading…' : 'Upload Document'}
        </button>
      </TabCta>
    </>
  )
}
