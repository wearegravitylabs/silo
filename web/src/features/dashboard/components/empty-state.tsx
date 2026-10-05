export function EmptyState({ portfolioName, onAddAsset }: { portfolioName: string; onAddAsset: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6" style={{ padding: '80px 40px', animation: 'fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) both' }}>
      {/* Illustration */}
      <div className="flex items-center justify-center" style={{ width: '80px', height: '80px', borderRadius: '20px', background: '#EFF0F5' }}>
        <svg width="40" height="44" viewBox="0 0 18 22" fill="none" opacity="0.5">
          <path d="M2 4.5L9 0.5L16 4.5V6.5H2V4.5Z" fill="#033AB8" />
          <rect x="1.5" y="7" width="15" height="2" rx="0.5" fill="#033AB8" />
          <rect x="1.5" y="10" width="15" height="2" rx="0.5" fill="#033AB8" />
          <rect x="1.5" y="13" width="15" height="2" rx="0.5" fill="#033AB8" />
          <rect x="1.5" y="16" width="15" height="2" rx="0.5" fill="#033AB8" />
          <rect x="0.5" y="19" width="17" height="2.5" rx="0.5" fill="#020202" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-2" style={{ maxWidth: '360px', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, lineHeight: '28px', color: '#2C2E35' }}>
          {portfolioName} is empty
        </span>
        <span style={{ fontSize: '14px', lineHeight: '22px', color: '#6E738C' }}>
          Add your first asset or debt to start tracking your net worth, allocation, and financial health over time.
        </span>
      </div>

      {/* CTA */}
      <button type="button"
        onClick={onAddAsset}
        className="flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-[opacity,transform]"
        style={{ height: '36px', padding: '0 16px', borderRadius: '8px', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', fontSize: '13px', fontWeight: 600, color: '#FFF', border: 'none', cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2.5v9M2.5 7h9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Add your first asset
      </button>
    </div>
  )
}
