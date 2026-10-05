import { PANEL_SHADOW } from '@/lib/shadows'
import { Sk } from './card'

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" style={{ padding: '28px 40px 40px', animation: 'fadeInUp 0.4s ease both' }}>
      {/* Net worth */}
      <div style={{ background: '#FFF', boxShadow: PANEL_SHADOW, borderRadius: '16px', padding: '16px' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '20px' }}>
          <Sk w={16} h={16} pill /><Sk w={80} h={14} />
        </div>
        <Sk w={200} h={32} /><div style={{ height: '8px' }} />
        <Sk w={120} h={12} /><div style={{ height: '20px' }} />
        <Sk w="100%" h={180} />
      </div>
      {/* Allocation */}
      <div style={{ background: '#FFF', boxShadow: PANEL_SHADOW, borderRadius: '16px', padding: '16px' }}>
        <Sk w={160} h={14} /><div style={{ height: '16px' }} />
        <div className="flex gap-6">
          <div className="flex-1"><Sk w="100%" h={120} /></div>
          <div className="flex-1"><Sk w="100%" h={120} /></div>
        </div>
      </div>
    </div>
  )
}
