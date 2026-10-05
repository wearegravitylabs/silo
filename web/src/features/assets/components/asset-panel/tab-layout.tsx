import type { ReactNode } from 'react'

/** Scrollable tab body; the panel shell provides the flex column it sits in. */
export function TabBody({ children }: { children: ReactNode }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  )
}

/** Action strip pinned under a tab body. */
export function TabCta({ children }: { children: ReactNode }) {
  return (
    <div style={{ height: '76px', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderTop: '1px solid rgba(239,240,245,0.8)' }}>
      {children}
    </div>
  )
}

/** Centered "nothing here yet" message. */
export function TabEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '280px' }}>
      <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px', textAlign: 'center' }}>{title}</span>
      <span style={{ fontSize: '12px', color: '#6E738C', textAlign: 'center', maxWidth: '220px', lineHeight: '20px' }}>{body}</span>
    </div>
  )
}
