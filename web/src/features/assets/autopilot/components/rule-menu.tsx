import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DROPDOWN_SHADOW } from '@/lib/shadows'
import { useRuleMutations } from '../queries'
import type { AutopilotRule } from '../types'

export function RuleMenu({
  rule, portfolioId, onEdit, onPause, onResume, onDelete,
}: {
  rule: AutopilotRule
  portfolioId: string
  onEdit: () => void
  onPause: () => void
  onResume?: () => void
  onDelete?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const handleOpen = () => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 4, left: r.right - 148 })
    setOpen(v => !v)
  }

  const { remove, resume } = useRuleMutations(portfolioId)
  const deleteRule = () => remove.mutate(rule.id, { onSuccess: onDelete })
  const resumeRule = () => resume.mutate(rule.id, { onSuccess: onResume })

  const item = (label: string, icon: React.ReactNode, color: string, onClick: () => void) => (
    <button type="button" onClick={() => { setOpen(false); onClick() }}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color, textAlign: 'left' }}>
      {icon}{label}
    </button>
  )

  return (
    <>
      <button ref={btnRef} type="button" onClick={handleOpen}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', color: '#B3B8CB', borderRadius: '4px' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="3" cy="7" r="1.1" fill="currentColor"/><circle cx="7" cy="7" r="1.1" fill="currentColor"/><circle cx="11" cy="7" r="1.1" fill="currentColor"/>
        </svg>
      </button>
      {open && createPortal(
        <div ref={menuRef} style={{ position: 'fixed', top: pos.top, left: pos.left, width: '148px', background: '#FFF', boxShadow: DROPDOWN_SHADOW, borderRadius: '10px', zIndex: 400, padding: '4px', overflow: 'hidden' }}>
          {rule.is_active
            ? item('Pause Rule',
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2.5" y="2" width="3" height="8" rx="0.8" fill="currentColor"/><rect x="6.5" y="2" width="3" height="8" rx="0.8" fill="currentColor"/></svg>,
                '#2C2E35', onPause)
            : item('Resume Rule',
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 2l7 4-7 4V2z" fill="currentColor"/></svg>,
                '#008753', resumeRule)
          }
          {item('Edit Rule',
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2-7 7-2.5.5.5-2.5 7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
            '#2C2E35', onEdit)}
          {item('Delete Rule',
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4 3V2h4v1M5 5.5v3M7 5.5v3M3 3l.5 7h5l.5-7H3z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
            '#F03722', () => deleteRule())}
        </div>,
        document.body,
      )}
    </>
  )
}
