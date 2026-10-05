import { PANEL_SHADOW } from '@/lib/shadows'
import { ExpandIcon } from './icons'

export function Sk({ w, h, pill }: { w: string | number; h: string | number; pill?: boolean }) {
  return (
    <div
      className="bg-[#EFF0F5] shrink-0"
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: typeof h === 'number' ? `${h}px` : h,
        borderRadius: pill ? '999px' : '4px',
      }}
    />
  )
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{ background: '#FFF', boxShadow: PANEL_SHADOW, borderRadius: '16px', overflow: 'hidden' }}
    >
      {children}
    </div>
  )
}

export function CardHead({ icon, title, right }: { icon: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderBottom: '1px solid #EFF0F5', height: '46px' }}>
      <div className="flex items-center gap-2">
        {icon}
        <span style={{ fontSize: '14px', fontWeight: 500, lineHeight: '22px', letterSpacing: '0.1px', color: '#2C2E35' }}>{title}</span>
      </div>
      {right ?? <ExpandIcon />}
    </div>
  )
}
