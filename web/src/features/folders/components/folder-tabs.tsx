import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon, DotsIcon, EyeIcon, EyeOffIcon } from '@/components/icons'
import { DROPDOWN_SHADOW } from '@/lib/shadows'
import { useFolderMutations } from '../queries'
import type { Folder } from '../types'

export const FOLDER_TAB_COLORS = ['#1A56DB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2']

export function FolderTabIcon({ color }: { color: string }) {
  return (
    <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="11" height="10" viewBox="0 0 11 10" fill="none">
        <path d="M.5 2a1 1 0 0 1 1-1H4l1 1h4.5a1 1 0 0 1 1 1V8a1 1 0 0 1-1 1H1.5A1 1 0 0 1 .5 8V2Z" fill="white" opacity="0.9" />
      </svg>
    </div>
  )
}

export function FolderTabMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (open) { setOpen(false); return }
    const rect = btnRef.current!.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left })
    setOpen(true)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="flex items-center justify-center transition-opacity"
        style={{
          width: '18px', height: '18px', borderRadius: '4px', border: 'none',
          background: 'transparent', cursor: 'pointer', padding: 0,
          color: open ? '#6E738C' : '#C8CCDA', flexShrink: 0,
        }}
      >
        <DotsIcon />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, zIndex: 1000,
            width: '139px', background: '#FFFFFF', borderRadius: '10px',
            padding: '2px', display: 'flex', flexDirection: 'column', gap: '2px',
            boxShadow: DROPDOWN_SHADOW,
          }}
        >
          {[
            { label: 'Edit', color: '#2C2E35', hover: '#F9F9FB', action: onEdit },
            { label: 'Delete', color: '#F03722', hover: '#FFF5F5', action: onDelete },
          ].map(({ label, color, hover, action }) => (
            <button
              key={label}
              type="button"
              onClick={() => { action(); setOpen(false) }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              style={{
                display: 'flex', alignItems: 'center', padding: '8px 10px',
                borderRadius: '8px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontSize: '13px', color, width: '100%', textAlign: 'left',
              }}
            >
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

export function FolderTabs({
  folders, selectedId, onSelect, portfolioId, onFolderCreated, showCards, onToggleCards,
}: {
  folders: Folder[]
  selectedId: string | null
  onSelect: (id: string) => void
  portfolioId: string
  onFolderCreated: (id: string) => void
  showCards: boolean
  onToggleCards: () => void
}) {
  // ── new folder ──────────────────────────────────────────────────────────
  const [showInput, setShowInput] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (showInput) inputRef.current?.focus() }, [showInput])

  // ── drag & drop ─────────────────────────────────────────────────────────
  const [dragOrder, setDragOrder] = useState<Folder[] | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const dragOverId = useRef<string | null>(null)
  const localFolders = dragOrder ?? folders

  // ── inline rename ───────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // ── mutations ───────────────────────────────────────────────────────────
  const { create, rename, remove, reorder } = useFolderMutations(portfolioId, 'asset')
  const creating = create.isPending

  const createFolder = (name: string) =>
    create.mutate(name, {
      onSuccess: (folder) => {
        setShowInput(false); setInputValue('')
        onFolderCreated(folder.id)
      },
    })
  const renameFolder = (v: { id: string; name: string }) =>
    rename.mutate(v, { onSuccess: () => setEditingId(null) })
  const deleteFolder = (id: string) =>
    remove.mutate(id, {
      onSuccess: () => {
        if (id === selectedId) {
          const remaining = localFolders.filter(f => f.id !== id)
          if (remaining.length) onSelect(remaining[0].id)
        }
      },
    })
  const reorderFolders = (ordered: Folder[]) => reorder.mutate(ordered)

  // ── drag handlers ───────────────────────────────────────────────────────
  const handleDragStart = (id: string) => { setDraggedId(id); setDragOrder(folders); dragOverId.current = id }

  const handleDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault()
    if (overId === draggedId || overId === dragOverId.current) return
    dragOverId.current = overId
    setDragOrder(prev => {
      if (!prev) return prev
      const from = prev.findIndex(f => f.id === draggedId)
      const to = prev.findIndex(f => f.id === overId)
      if (from === -1 || to === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  const handleDrop = () => {
    if (draggedId) reorderFolders(localFolders)
    setDraggedId(null); setDragOrder(null); dragOverId.current = null
  }

  const handleDragEnd = () => { setDraggedId(null); setDragOrder(null); dragOverId.current = null }

  const handleCreate = () => {
    const name = inputValue.trim()
    if (!name) { setShowInput(false); setInputValue(''); return }
    createFolder(name)
  }

  const commitRename = (id: string) => {
    const name = editValue.trim()
    if (name) renameFolder({ id, name })
    else setEditingId(null)
  }

  return (
    <div style={{ borderBottom: '1px solid #EFF0F5', padding: '0 40px', display: 'flex', alignItems: 'flex-end', overflowX: 'auto', flexShrink: 0, position: 'relative' }}>
      {localFolders.map((folder, i) => {
        const isActive = folder.id === selectedId
        const color = FOLDER_TAB_COLORS[i % FOLDER_TAB_COLORS.length]
        const isDragging = folder.id === draggedId

        if (editingId === folder.id) {
          return (
            <div key={folder.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', marginBottom: '-1px', borderBottom: '2px solid #033AB8' }}>
              <FolderTabIcon color={color} />
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(folder.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                onBlur={() => commitRename(folder.id)}
                style={{ height: '24px', padding: '0 8px', borderRadius: '5px', border: '1px solid #033AB8', fontSize: '13px', color: '#2C2E35', background: '#FFF', outline: 'none', width: '110px' }}
              />
            </div>
          )
        }

        return (
          <div
            key={folder.id}
            draggable
            onDragStart={() => handleDragStart(folder.id)}
            onDragOver={(e) => handleDragOver(e, folder.id)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            style={{
              display: 'flex', alignItems: 'center',
              borderBottom: isActive ? '2px solid #033AB8' : '2px solid transparent',
              marginBottom: '-1px',
              opacity: isDragging ? 0.35 : 1,
              transition: 'opacity 0.12s',
              cursor: 'grab',
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(folder.id)}
              style={{
                padding: '10px 6px 10px 14px', border: 'none', background: 'transparent',
                cursor: 'pointer', color: isActive ? '#2C2E35' : '#6E738C',
                fontSize: '13px', fontWeight: isActive ? 600 : 500,
                whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <FolderTabIcon color={color} />
              <span>{folder.name}</span>
            </button>

            <div style={{ paddingRight: '10px', display: 'flex', alignItems: 'center' }}>
              <FolderTabMenu
                onEdit={() => { setEditingId(folder.id); setEditValue(folder.name) }}
                onDelete={() => deleteFolder(folder.id)}
              />
            </div>
          </div>
        )
      })}

      {showInput && (
        <div className="flex items-center gap-2" style={{ padding: '6px 8px', marginBottom: '4px' }}>
          <input ref={inputRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowInput(false); setInputValue('') } }}
            placeholder="Folder name" disabled={creating}
            style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: '1px solid #033AB8', fontSize: '13px', color: '#2C2E35', background: '#FFF', outline: 'none', width: '140px' }} />
          <button type="button" onClick={handleCreate} disabled={creating}
            style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: 'none', background: '#033AB8', color: '#FFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            {creating ? '…' : 'Create'}
          </button>
          <button type="button" onClick={() => { setShowInput(false); setInputValue('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}>
            <CloseIcon size={14} />
          </button>
        </div>
      )}

      {!showInput && (
        <button type="button" onClick={() => setShowInput(true)}
          className="flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ width: '32px', height: '32px', marginBottom: '4px', marginLeft: '4px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="#B3B8CB" strokeWidth="1.2" />
            <path d="M8 5v6M5 8h6" stroke="#B3B8CB" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Eye toggle — pushed to far right */}
      <button
        type="button"
        onClick={onToggleCards}
        title={showCards ? 'Hide stats' : 'Show stats'}
        style={{ marginLeft: 'auto', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#B3B8CB', padding: '2px 4px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, flexShrink: 0, transition: 'color 0.15s' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#6E738C')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#B3B8CB')}
      >
        {showCards ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
        <span>{showCards ? 'Hide' : 'Show'}</span>
      </button>
    </div>
  )
}
