import { useState } from 'react'
import type { AssetItem, FolderRef } from '../../types'

export const FOLDER_COLORS = [
  ['#044FFA', '#033AB8'],
  ['#843CFF', '#5D04F6'],
  ['#BBE03B', '#5C7813'],
  ['#F03722', '#C91F0C'],
  ['#00B17A', '#007A54'],
  ['#F5A623', '#C07D12'],
]

export function FolderIcon({ color1, color2, size = 40 }: { color1: string; color2: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M2 12a3 3 0 013-3h10.5l3 3H35a3 3 0 013 3v16a3 3 0 01-3 3H5a3 3 0 01-3-3V12z" fill={`url(#fc-${color1.replace('#','')})`}/>
      <defs>
        <linearGradient id={`fc-${color1.replace('#','')}`} x1="20" y1="9" x2="20" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor={color1}/>
          <stop offset="1" stopColor={color2}/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export function MoveFolderModalContent({
  asset, folders, allAssets, isPending, onMove, onClose,
}: {
  asset: AssetItem
  folders: FolderRef[]
  allAssets: AssetItem[]
  isPending: boolean
  onMove: (folderId: string) => void
  onClose: () => void
}) {
  const [selectedFolderId, setSelectedFolderId] = useState(asset.folder_id)

  const assetCountByFolder = allAssets.reduce<Record<string, number>>((acc, a) => {
    acc[a.folder_id] = (acc[a.folder_id] ?? 0) + 1
    return acc
  }, {})

  const canMove = selectedFolderId !== asset.folder_id

  return (
    <>
      {/* Header */}
      <div style={{ height: '54px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EFF0F5', flexShrink: 0 }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Move to Folder</span>
        <button type="button" onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="#6E738C" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>
      {/* Body */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
        {folders.map((folder, idx) => {
          const [c1, c2] = FOLDER_COLORS[idx % FOLDER_COLORS.length]
          const count = assetCountByFolder[folder.id] ?? 0
          const isSelected = selectedFolderId === folder.id
          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => setSelectedFolderId(folder.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: '12px', border: `1px solid ${isSelected ? '#033AB8' : '#EFF0F5'}`,
                background: '#FFFFFF', cursor: 'pointer', textAlign: 'left', width: '100%',
                boxShadow: isSelected ? '0px 0px 0px 2px #ECF7FF' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                <FolderIcon color1={c1} color2={c2} size={40} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px', lineHeight: '22px' }}>{folder.name}</span>
                  <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px' }}>{count} {count === 1 ? 'asset' : 'assets'}</span>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: isSelected ? 1 : 0, flexShrink: 0 }}>
                <path d="M2 8l4.5 4.5L14 3.5" stroke="#033AB8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )
        })}
      </div>
      {/* Footer */}
      <div style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #EFF0F5', flexShrink: 0 }}>
        <button type="button" onClick={onClose}
          style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)', boxShadow: '0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.1)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#2C2E35' }}>
          Cancel
        </button>
        <button type="button" onClick={() => onMove(selectedFolderId)} disabled={!canMove || isPending}
          style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: 'none', background: canMove ? 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)' : '#E3E5ED', cursor: canMove && !isPending ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 600, color: canMove ? '#FFFFFF' : '#B3B8CB', transition: 'background 0.15s' }}>
          {isPending ? 'Moving…' : 'Move to Folder'}
        </button>
      </div>
    </>
  )
}
