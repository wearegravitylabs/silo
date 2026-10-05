import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from '@/components/icons'
import { BTN_SHADOW, DROPDOWN_SHADOW } from '@/lib/shadows'

export const QUICK_ACTIONS = [
  { icon: 'add', label: 'Add asset',     active: true  },
  { icon: 'add', label: 'Add debt',      active: false },
  { icon: 'add', label: 'Add portfolio', active: false },
  { icon: 'add', label: 'Invite member', active: false },
  { icon: 'upload', label: 'Import data', active: false },
] as const

export function QuickActionsMenu({ onAddAsset }: { onAddAsset: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 hover:opacity-80 active:scale-[0.97] transition-[opacity,transform]"
        style={{
          height: '28px',
          padding: '0 10px',
          borderRadius: '6px',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)',
          boxShadow: BTN_SHADOW,
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          color: '#2C2E35',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        Quick Actions
        <ChevronDownIcon />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '260px',
            background: '#FFF',
            boxShadow: DROPDOWN_SHADOW,
            borderRadius: '10px',
            zIndex: 50,
            padding: '2px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {QUICK_ACTIONS.map((item) => {
            const isAddAsset = item.label === 'Add asset'
            return (
              <button
                key={item.label}
                type="button"
                disabled={!isAddAsset && !item.active}
                onClick={isAddAsset ? () => { setOpen(false); onAddAsset() } : undefined}
                className="flex items-center gap-2 w-full"
                style={{
                  padding: '5px 8px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: item.active ? '#EFF0F5' : 'transparent',
                  cursor: isAddAsset ? 'pointer' : 'not-allowed',
                  opacity: item.active ? 1 : 0.55,
                  textAlign: 'left',
                }}
              >
                {/* Icon */}
                <div style={{ width: '16px', height: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon === 'add' ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M8 1.5a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 8 1.5ZM7.25 5a.75.75 0 0 1 1.5 0v2.25H11a.75.75 0 0 1 0 1.5H8.75V11a.75.75 0 0 1-1.5 0V8.75H5a.75.75 0 0 1 0-1.5h2.25V5Z" fill="#6E738C" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M8 1.5a.75.75 0 0 1 .75.75V9.94l1.97-1.97a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 9.03a.75.75 0 0 1 1.06-1.06L7.25 9.94V2.25A.75.75 0 0 1 8 1.5ZM2.5 13.25a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 0 1.5h-9.5a.75.75 0 0 1-.75-.75Z" fill="#6E738C" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '0.1px', color: '#2C2E35' }}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
