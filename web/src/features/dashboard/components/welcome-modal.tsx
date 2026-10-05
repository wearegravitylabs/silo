import { CloseIcon } from '@/components/icons'
import { ELEVATED_SHADOW } from '@/lib/shadows'

export function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: '100px', background: 'rgba(4,1,3,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '426px', background: '#FFF', borderRadius: '16px', boxShadow: ELEVATED_SHADOW, overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) both' }}>
        <div className="flex items-center justify-between shrink-0" style={{ padding: '16px 20px', borderBottom: '1px solid #EFF0F5', height: '54px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Welcome to Silo!</span>
          <button type="button" onClick={onClose} className="hover:opacity-70 transition-opacity flex items-center justify-center"><CloseIcon /></button>
        </div>
        <div style={{ width: '426px', height: '184px', background: '#EFF0F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="64" height="72" viewBox="0 0 18 22" fill="none" opacity="0.35">
            <path d="M2 4.5L9 0.5L16 4.5V6.5H2V4.5Z" fill="#033AB8" />
            <rect x="1.5" y="7" width="15" height="2" rx="0.5" fill="#033AB8" />
            <rect x="1.5" y="10" width="15" height="2" rx="0.5" fill="#033AB8" />
            <rect x="1.5" y="13" width="15" height="2" rx="0.5" fill="#033AB8" />
            <rect x="1.5" y="16" width="15" height="2" rx="0.5" fill="#033AB8" />
            <rect x="0.5" y="19" width="17" height="2.5" rx="0.5" fill="#020202" />
          </svg>
        </div>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #EFF0F5' }}>
          <p style={{ fontSize: '12px', lineHeight: '20px', color: '#6E738C' }}>
            Your portfolio is ready. Start adding assets — stocks, crypto, real estate, or anything you own or owe. Everything is stored privately on your own infrastructure, always.
          </p>
        </div>
        <div className="flex items-center justify-between" style={{ padding: '12px 20px', height: '56px' }}>
          <div style={{ width: '88px', opacity: 0, pointerEvents: 'none', height: '28px' }} />
          <div className="flex items-center" style={{ gap: '4px', padding: '4px', borderRadius: '16px', background: '#FFF' }}>
            <div style={{ width: '12px', height: '6px', background: '#BBE03B', borderRadius: '56px' }} />
            <div style={{ width: '6px', height: '6px', background: '#E3E5ED', borderRadius: '50%' }} />
          </div>
          <button type="button" onClick={onClose} className="flex items-center justify-center text-white font-semibold hover:opacity-90 active:scale-[0.97] transition-[opacity,transform]"
            style={{ width: '88px', height: '28px', borderRadius: '6px', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', fontSize: '12px', border: 'none', cursor: 'pointer' }}>
            Explore Silo
          </button>
        </div>
      </div>
    </div>
  )
}
