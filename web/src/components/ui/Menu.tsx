import { type ReactNode, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface MenuItem {
  label: string
  icon?: ReactNode
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
  href?: string
}

export interface MenuDivider {
  divider: true
}

export type MenuEntry = MenuItem | MenuDivider

function isDivider(entry: MenuEntry): entry is MenuDivider {
  return 'divider' in entry
}

interface MenuProps {
  trigger: ReactNode
  items: MenuEntry[]
  align?: 'left' | 'right'
  className?: string
}

export function Menu({ trigger, items, align = 'left', className }: MenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex">
      <div
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setOpen((o) => !o)}
      >
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            'absolute top-full mt-2 z-50 min-w-[180px]',
            'bg-background border border-border rounded-xl shadow-lg',
            'py-1.5 overflow-hidden',
            align === 'right' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {items.map((entry, i) => {
            if (isDivider(entry)) {
              return <div key={i} className="my-1 border-t border-border" />
            }
            const itemClass = cn(
              'flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-left',
              'transition-colors outline-none',
              entry.danger
                ? 'text-danger hover:bg-danger-light'
                : 'text-foreground hover:bg-surface',
              entry.disabled && 'opacity-40 pointer-events-none',
            )
            const content = (
              <>
                {entry.icon && (
                  <span className="shrink-0 w-4 h-4 flex items-center justify-center">
                    {entry.icon}
                  </span>
                )}
                <span>{entry.label}</span>
              </>
            )
            if (entry.href) {
              return (
                <a
                  key={i}
                  href={entry.href}
                  className={itemClass}
                  onClick={() => setOpen(false)}
                >
                  {content}
                </a>
              )
            }
            return (
              <button
                key={i}
                type="button"
                disabled={entry.disabled}
                onClick={() => {
                  entry.onClick?.()
                  setOpen(false)
                }}
                className={itemClass}
              >
                {content}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
