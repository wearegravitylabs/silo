export function PerformanceBadge({ pct }: { pct: number | null | undefined }) {
  if (pct == null) return <span style={{ fontSize: '12px', color: '#B3B8CB' }}>—</span>
  const up = pct >= 0
  return (
    <div className="inline-flex items-center gap-1"
      style={{ padding: '3px 8px', borderRadius: '6px', background: up ? '#F0FBF4' : '#FEF2F2', fontSize: '12px', fontWeight: 500, color: up ? '#008753' : '#C50F3C' }}>
      <span>{up ? '↗' : '↘'}</span>
      <span>{Math.abs(pct).toFixed(1)}%</span>
    </div>
  )
}
