import type { DashboardChartPoint } from '../types'

export function LineChart({ points }: { points: DashboardChartPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ height: '180px', background: '#FAFAFA', border: '1px solid #EFF0F5', borderRadius: '10px' }}>
        <span style={{ fontSize: '12px', color: '#B3B8CB' }}>Not enough history for this period — try a shorter range</span>
      </div>
    )
  }

  const W = 800
  const H = 160
  const pad = { t: 12, r: 8, b: 20, l: 8 }
  const cW = W - pad.l - pad.r
  const cH = H - pad.t - pad.b

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const isPositive = values[values.length - 1] >= values[0]
  const lineColor = isPositive ? '#033AB8' : '#F03722'
  const gradColor = isPositive ? '#033AB8' : '#F03722'

  const pts = points.map((p, i) => ({
    x: pad.l + (i / (points.length - 1)) * cW,
    y: pad.t + cH - ((p.value - min) / range) * cH,
  }))

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1].x},${H - pad.b} L${pts[0].x},${H - pad.b} Z`

  return (
    <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #EFF0F5' }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor={gradColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#cg)" />
        <path d={line} stroke={lineColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
