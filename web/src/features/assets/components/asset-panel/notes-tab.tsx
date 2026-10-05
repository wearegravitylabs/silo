import { useState } from 'react'
import { createPortal } from 'react-dom'
import { PlusCircleIcon } from '@/components/icons'
import { useAssetNotes, useNoteMutations } from '../../queries'
import type { AssetItem, AssetNote } from '../../types'
import { TabBody, TabCta, TabEmpty } from './tab-layout'

/** Note tab: list, add, edit and delete notes on this asset. */
export function NotesTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<AssetNote | null>(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteTags, setNoteTags] = useState('')

  const { data: notes } = useAssetNotes(portfolioId, asset.id)
  const { save, remove: removeNote } = useNoteMutations(portfolioId, asset.id)
  const savingNote = save.isPending

  const saveNote = () =>
    save.mutate(
      {
        noteId: editingNote?.id,
        title: noteTitle,
        content: noteContent,
        tags: noteTags.split(',').map(t => t.trim()).filter(Boolean),
      },
      {
        onSuccess: () => {
          setNoteModalOpen(false); setEditingNote(null); setNoteTitle(''); setNoteContent(''); setNoteTags('')
        },
      },
    )

  const openCompose = (note?: AssetNote) => {
    if (note) {
      setEditingNote(note)
      setNoteTitle(note.title)
      setNoteContent(note.content)
      setNoteTags((note.tags?.items ?? []).join(', '))
    } else {
      setEditingNote(null); setNoteTitle(''); setNoteContent(''); setNoteTags('')
    }
    setNoteModalOpen(true)
  }

  return (
    <>
      <TabBody>
        {notes?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notes.map((note: AssetNote) => {
              const tagList = note.tags?.items ?? []
              return (
                <div key={note.id} style={{ background: '#F9F9FB', borderRadius: '12px' }}>
                  {/* Note card header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px', height: '26px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 500, color: '#6E738C', letterSpacing: '1px', textTransform: 'uppercase' }}>{note.title || 'NOTE'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button type="button" onClick={() => openCompose(note)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#B3B8CB' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.3 2.7a1.5 1.5 0 012.1 2.1L5 13.3l-3 .7.7-3 8.6-8.3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                      </button>
                      <button type="button" onClick={() => removeNote.mutate(note.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#B3B8CB' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M5 4V3h6v1M6 7v4M10 7v4M4 4l.7 9h6.6L12 4H4z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  </div>
                  {/* Note card body */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #EFF0F5', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px', lineHeight: '22px' }}>{note.title || 'Untitled'}</span>
                    <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{note.content}</span>
                    {tagList.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                        {tagList.map(tag => (
                          <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', padding: '0 4px', height: '20px', background: '#EFF0F5', border: '0.5px solid #E3E5ED', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <TabEmpty title="No notes added" body="Add notes to keep track of information about this asset." />
        )}
      </TabBody>
      <TabCta>
        <button type="button" onClick={() => openCompose()}
          style={{ height: '32px', padding: '0 12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PlusCircleIcon color="#FFF" size={14} />
          Add Note
        </button>
      </TabCta>

        {noteModalOpen && createPortal(
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}
            onClick={() => { setNoteModalOpen(false); setEditingNote(null) }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,3,0.4)' }} />
            <div
              style={{ position: 'relative', width: '426px', marginTop: '104px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 4px 4px -2px rgba(17,29,80,0.04), 0px 2px 2px -1px rgba(17,29,80,0.04), 0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.08)', display: 'flex', flexDirection: 'column', animation: 'fadeInUpSm 0.2s cubic-bezier(0.16,1,0.3,1) both' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div style={{ height: '54px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EFF0F5', flexShrink: 0 }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{editingNote ? 'Edit Note' : 'Add Note'}</span>
                <button type="button" onClick={() => { setNoteModalOpen(false); setEditingNote(null) }}
                  style={{ width: '28px', height: '28px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="#6E738C" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>

              {/* Modal body */}
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Title field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Title</label>
                  <div style={{ background: '#F9F9FB', borderRadius: '12px', height: '40px', display: 'flex', alignItems: 'center' }}>
                    <input
                      value={noteTitle}
                      onChange={e => setNoteTitle(e.target.value)}
                      placeholder="Note title"
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '8px 16px', fontSize: '14px', color: '#2C2E35', fontFamily: 'var(--font-sans)', letterSpacing: '-0.1px' }}
                    />
                  </div>
                </div>
                {/* Notes field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Notes</label>
                    <span style={{ fontSize: '14px', color: '#F03722' }}>*</span>
                  </div>
                  <div style={{ background: '#F9F9FB', borderRadius: '12px', height: '120px' }}>
                    <textarea
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                      placeholder="Write your note here…"
                      style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '10px 16px', fontSize: '14px', color: '#2C2E35', fontFamily: 'var(--font-sans)', letterSpacing: '-0.1px', resize: 'none', lineHeight: '22px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                {/* Tags field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Tags</label>
                  <div style={{ background: '#F9F9FB', borderRadius: '12px', height: '40px', display: 'flex', alignItems: 'center' }}>
                    <input
                      value={noteTags}
                      onChange={e => setNoteTags(e.target.value)}
                      placeholder="e.g. Finance, Investment"
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '8px 16px', fontSize: '14px', color: '#2C2E35', fontFamily: 'var(--font-sans)', letterSpacing: '-0.1px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #EFF0F5', flexShrink: 0 }}>
                <button type="button" onClick={() => { setNoteModalOpen(false); setEditingNote(null) }}
                  style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)', boxShadow: '0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.1)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#2C2E35' }}>
                  Cancel
                </button>
                <button type="button" onClick={saveNote} disabled={savingNote || !noteContent.trim()}
                  style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: 'none', background: !noteContent.trim() ? '#E3E5ED' : 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', cursor: !noteContent.trim() ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, color: !noteContent.trim() ? '#B3B8CB' : '#FFFFFF', transition: 'background 0.15s' }}>
                  {savingNote ? 'Saving…' : editingNote ? 'Save Changes' : 'Add Note'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
