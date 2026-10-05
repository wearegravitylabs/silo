import { useState } from 'react'
import { createPortal } from 'react-dom'
import { currencyFlag, formatCurrency, formatDate } from '@/lib/format'
import { AutopilotTab } from '../../autopilot/components/autopilot-tab'
import { useRules } from '../../autopilot/queries'
import { ASSET_TYPE_LABELS } from '../../constants'
import { useAssetNotes, useDeleteAsset, useUpdateAsset } from '../../queries'
import type { AssetItem, FolderRef } from '../../types'
import { DocumentsTab } from './documents-tab'
import { HistoryTab } from './history-tab'
import { MoveFolderModalContent } from './move-folder-modal'
import { NotesTab } from './notes-tab'
import { ReportingTab } from './reporting-tab'

export type PanelTab = 'history' | 'autopilot' | 'reporting' | 'note' | 'documents'

export const TABS: { id: PanelTab; label: string }[] = [
  { id: 'history', label: 'History' },
  { id: 'autopilot', label: 'Auto-Pilot' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'note', label: 'Note' },
  { id: 'documents', label: 'Documents' },
]

/**
 * Slide-in detail panel for one asset. Render with key={asset.id} so tab state
 * resets when a different asset is opened.
 */
export function AssetSidePanel({
  asset, portfolioId, folders, allAssets, onClose,
}: {
  asset: AssetItem
  portfolioId: string
  folders?: FolderRef[]
  allAssets?: AssetItem[]
  onClose: () => void
}) {
  const [tab, setTab] = useState<PanelTab>('history')
  const [showPanelMenu, setShowPanelMenu] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState({ bottom: 0, right: 0 })
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const folderName = folders?.find(f => f.id === asset.folder_id)?.name

  // Tab-bar badges. Notes load only once the Note tab has been opened, as before.
  const { data: allRules } = useRules(portfolioId)
  const rules = (allRules ?? []).filter(r => r.target_id === asset.id)
  const { data: notes } = useAssetNotes(portfolioId, asset.id, { enabled: tab === 'note' })

  const { mutate: moveAsset, isPending: movingAsset } = useUpdateAsset(portfolioId, asset.id)
  const { mutate: deleteAsset, isPending: deletingAsset } = useDeleteAsset(portfolioId, asset.id)

  return (
    <>
      <div
        style={{
          position: 'absolute', top: 0, right: 0, width: '482px', height: '100%',
          background: '#FFFFFF', boxShadow: '-4px 0 32px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', zIndex: 20,
          animation: 'slideInRight 0.22s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* ── Panel header bar (48px) ── */}
        <div style={{ height: '48px', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <button type="button" onClick={onClose}
            style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="#6E738C" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              const { bottom, right } = e.currentTarget.getBoundingClientRect()
              setMenuAnchor({ bottom, right })
              setShowPanelMenu(v => !v)
            }}
            style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: showPanelMenu ? '#EFF0F5' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="4" r="1.2" fill="#6E738C"/>
              <circle cx="8" cy="8" r="1.2" fill="#6E738C"/>
              <circle cx="8" cy="12" r="1.2" fill="#6E738C"/>
            </svg>
          </button>
        </div>

        {/* ── Asset info section ── */}
        <div style={{ padding: '20px 24px 16px', flexShrink: 0 }}>
          {/* Logo then name — stacked (column) per spec */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '96px', border: '1px solid #EFF0F5', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, padding: '8px', boxSizing: 'border-box' }}>
              {asset.logo_url ? (
                <img src={asset.logo_url} alt={asset.name} style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '60px' }} />
              ) : asset.icon ? (
                <span dangerouslySetInnerHTML={{ __html: asset.icon }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }} />
              ) : (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#6E738C' }}>{(asset.ticker || asset.name).slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, lineHeight: '32px', letterSpacing: '-0.1px', color: '#2C2E35' }}>{asset.name}</span>
          </div>

          {/* Properties rows — label left (140px), value right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '140px', fontSize: '14px', lineHeight: '22px', color: '#6E738C', letterSpacing: '-0.1px', flexShrink: 0 }}>Asset Type</span>
              <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}</span>
            </div>
            {asset.ticker && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ width: '140px', fontSize: '14px', lineHeight: '22px', color: '#6E738C', letterSpacing: '-0.1px', flexShrink: 0 }}>Ticker</span>
                <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{asset.ticker}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '140px', fontSize: '14px', lineHeight: '22px', color: '#6E738C', letterSpacing: '-0.1px', flexShrink: 0 }}>Currency</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '16px', lineHeight: '1' }}>{currencyFlag(asset.currency)}</span>
                <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{asset.currency}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '140px', fontSize: '14px', lineHeight: '22px', color: '#6E738C', letterSpacing: '-0.1px', flexShrink: 0 }}>Current Value</span>
              <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{formatCurrency(asset.owned_value_converted, asset.converted_currency)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '140px', fontSize: '14px', lineHeight: '22px', color: '#6E738C', letterSpacing: '-0.1px', flexShrink: 0 }}>Ownership</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{asset.ownership_pct}%</span>
                <div style={{ width: '57px', height: '4px', background: '#ECF7FF', borderRadius: '32px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '4px', width: `${Math.min(asset.ownership_pct, 100)}%`, background: '#033AB8', borderRadius: '32px' }} />
                </div>
              </div>
            </div>
            {folderName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ width: '140px', fontSize: '14px', lineHeight: '22px', color: '#6E738C', letterSpacing: '-0.1px', flexShrink: 0 }}>Folder</span>
                <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{folderName}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '140px', fontSize: '14px', lineHeight: '22px', color: '#6E738C', letterSpacing: '-0.1px', flexShrink: 0 }}>Last Updated</span>
              <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{formatDate(asset.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* ── Tab bar (40px) ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid #EFF0F5', padding: '0 24px', gap: '24px', flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              style={{
                height: '40px', border: 'none', background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0',
                fontSize: '14px', fontWeight: 500,
                color: tab === t.id ? '#2C2E35' : '#6E738C',
                borderBottom: tab === t.id ? '2px solid #033AB8' : '2px solid transparent',
                marginBottom: '-1px', whiteSpace: 'nowrap', boxSizing: 'border-box',
              }}>
              {t.label}
              {t.id === 'autopilot' && rules.length > 0 && (
                <span style={{ minWidth: '16px', height: '16px', borderRadius: '50%', background: tab === t.id ? '#033AB8' : '#B3B8CB', color: '#FFF', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  {rules.length}
                </span>
              )}
              {t.id === 'note' && (notes?.length ?? 0) > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', height: '20px', minWidth: '18px', background: '#EFF0F5', border: '0.5px solid #E3E5ED', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>
                  {notes?.length ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content (+ CTA strip for note/docs) ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {tab === 'history' && <HistoryTab asset={asset} portfolioId={portfolioId} />}
          {tab === 'autopilot' && <AutopilotTab asset={asset} portfolioId={portfolioId} />}
          {tab === 'reporting' && <ReportingTab asset={asset} portfolioId={portfolioId} />}
          {tab === 'note' && <NotesTab asset={asset} portfolioId={portfolioId} />}
          {tab === 'documents' && <DocumentsTab asset={asset} portfolioId={portfolioId} />}
        </div>
      </div>

      {showPanelMenu && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setShowPanelMenu(false)} />
          <div style={{
            position: 'fixed',
            top: menuAnchor.bottom + 4,
            left: menuAnchor.right - 191,
            width: '191px',
            background: '#FFFFFF',
            borderRadius: '10px',
            boxShadow: '0px 8px 8px -1px rgba(17,29,80,0.06), 0px 4px 4px -2px rgba(17,29,80,0.04), 0px 2px 2px -1px rgba(17,29,80,0.04), 0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.08)',
            padding: '2px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            zIndex: 300,
          }}>
            {([
              { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="8" rx="5.5" ry="3.5" stroke="#6E738C" strokeWidth="1.2"/><circle cx="8" cy="8" r="1.5" fill="#6E738C"/></svg>, label: 'View Details', color: '#2C2E35', action: () => { setShowPanelMenu(false) } },
               { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5a1 1 0 011-1h3l1.5 1.5H13a1 1 0 011 1V12a1 1 0 01-1 1H3a1 1 0 01-1-1V5z" stroke="#6E738C" strokeWidth="1.2" strokeLinejoin="round"/></svg>, label: 'Move to Folder', color: '#2C2E35', action: () => { setShowPanelMenu(false); setShowMoveModal(true) } },
               { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 13V4M3 4l2.5 2.5M3 4L0.5 6.5" stroke="#6E738C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 3h6M7 7h5M7 11h4" stroke="#6E738C" strokeWidth="1.2" strokeLinecap="round"/></svg>, label: 'Report Asset', color: '#2C2E35', action: () => { setShowPanelMenu(false); setTab('reporting') } },
            ] as { icon: React.ReactNode; label: string; color: string; action: () => void }[]).map(item => (
              <button key={item.label} type="button" onClick={item.action}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EFF0F5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ display: 'flex', alignItems: 'center', width: '16px', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1, padding: '0 4px', fontSize: '14px', fontWeight: 500, color: item.color, letterSpacing: '0.1px', lineHeight: '22px' }}>{item.label}</span>
              </button>
            ))}
            {/* Divider */}
            <div style={{ padding: '2px 10px' }}><div style={{ height: '1px', background: '#EFF0F5' }} /></div>
            {/* Delete */}
            <button type="button" onClick={() => { setShowPanelMenu(false); setShowDeleteModal(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FFF0EE')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ display: 'flex', alignItems: 'center', width: '16px', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M5 4V3h6v1M6 7v4M10 7v4M4 4l.7 9h6.6L12 4H4z" stroke="#F03722" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <span style={{ flex: 1, padding: '0 4px', fontSize: '14px', fontWeight: 500, color: '#F03722', letterSpacing: '0.1px', lineHeight: '22px' }}>Delete Asset</span>
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Move to Folder modal */}
      {showMoveModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}
          onClick={() => setShowMoveModal(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,3,0.4)' }} />
          <div style={{ position: 'relative', width: '426px', marginTop: '104px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 4px 4px -2px rgba(17,29,80,0.04), 0px 2px 2px -1px rgba(17,29,80,0.04), 0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.08)', display: 'flex', flexDirection: 'column', animation: 'fadeInUpSm 0.2s cubic-bezier(0.16,1,0.3,1) both', maxHeight: 'calc(100vh - 128px)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            <MoveFolderModalContent
              asset={asset}
              folders={folders ?? []}
              allAssets={allAssets ?? []}
              isPending={movingAsset}
              onMove={folderId => moveAsset({ folder_id: folderId }, { onSuccess: () => setShowMoveModal(false) })}
              onClose={() => setShowMoveModal(false)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Delete Asset modal */}
      {showDeleteModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}
          onClick={() => setShowDeleteModal(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,3,0.4)' }} />
          <div style={{ position: 'relative', width: '426px', marginTop: '104px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 4px 4px -2px rgba(17,29,80,0.04), 0px 2px 2px -1px rgba(17,29,80,0.04), 0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.08)', display: 'flex', flexDirection: 'column', animation: 'fadeInUpSm 0.2s cubic-bezier(0.16,1,0.3,1) both' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ height: '54px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EFF0F5', flexShrink: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Delete {asset.name}?</span>
              <button type="button" onClick={() => setShowDeleteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="#6E738C" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            {/* Body */}
            <div style={{ padding: '16px 20px' }}>
              <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px', display: 'block' }}>
                Are you sure you want to delete <strong style={{ color: '#2C2E35' }}>{asset.name}</strong>? This will permanently remove the asset and all its associated data including history, notes, and documents. This action cannot be undone.
              </span>
            </div>
            {/* Footer */}
            <div style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #EFF0F5', flexShrink: 0 }}>
              <button type="button" onClick={() => setShowDeleteModal(false)}
                style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)', boxShadow: '0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.1)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#2C2E35' }}>
                Cancel
              </button>
              <button type="button" onClick={() => deleteAsset(undefined, { onSuccess: onClose })} disabled={deletingAsset}
                style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(180deg, #F03722 0%, #C91F0C 100%)', cursor: deletingAsset ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', opacity: deletingAsset ? 0.7 : 1 }}>
                {deletingAsset ? 'Deleting…' : 'Delete Asset'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
