import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AvatarId } from '@/components/AvatarPicker'
import { portfolioApi, dashboardApi, currencyApi } from '@/lib/api'
import { Sidebar } from '@/components/AppSidebar'
import type {
  DashboardResponse,
  DashboardNetWorth,
  DashboardChartPoint,
  DashboardAllocItem,
  DashboardMover,
  DashboardDebt,
} from '@/types/api'
import { useAuthStore } from '@/store/auth'

// ─── Design tokens ─────────────────────────────────────────────────────────────
const PANEL_SHADOW =
  '0px 2px 2px -1px rgba(17,29,80,0.04), 0px 4px 2px -1px rgba(17,29,80,0.04), 0px 0px 0px 0.5px rgba(17,29,80,0.12)'
const BTN_SHADOW =
  '0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.1)'
const MODAL_SHADOW =
  '0px 4px 4px -2px rgba(17,29,80,0.04), 0px 2px 2px -1px rgba(17,29,80,0.04), 0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.08)'
const DROPDOWN_SHADOW =
  '0px 8px 8px -1px rgba(17,29,80,0.06), 0px 4px 4px -2px rgba(17,29,80,0.04), 0px 2px 2px -1px rgba(17,29,80,0.04), 0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.08)'

// ─── Period configuration ─────────────────────────────────────────────────────
const PERIODS = [
  { label: '1W', api: 'W' },
  { label: '1M', api: '1M' },
  { label: '3M', api: '3M' },
  { label: '6M', api: '6M' },
  { label: '1Y', api: '1Y' },
] as const
type UIPeriod = (typeof PERIODS)[number]['label']

// ─── Currency formatter ───────────────────────────────────────────────────────
function fmt(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

// ─── Flag emoji from ISO 4217 currency code ───────────────────────────────────
// Most codes start with the ISO 3166-1 alpha-2 country code (first 2 chars).
function currencyFlag(code: string): string {
  const cc = code.slice(0, 2).toUpperCase()
  return [...cc]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronDownIcon({ size = 12, color = '#6E738C' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M7 2a5 5 0 1 0 3.17 8.87l2.47 2.47a.75.75 0 1 0 1.06-1.06L11.23 9.8A5 5 0 0 0 7 2Zm-3.5 5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z" fill="#6E738C" />
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M10 2.5A4.5 4.5 0 1 0 10.97 7" stroke="#6E738C" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9 1.5l1 1-1 1" stroke="#6E738C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4L4 12" stroke="#6E738C" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function CoinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" fill="#EEF2FF" />
      <path fillRule="evenodd" clipRule="evenodd" d="M8 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm-.75 2.25a.75.75 0 0 1 1.5 0v.3c.64.18 1.25.7 1.25 1.45 0 .87-.74 1.4-1.5 1.53v1.47a.75.75 0 0 1-1.5 0v-.3C6.36 10.02 5.75 9.5 5.75 8.75c0-.87.74-1.4 1.5-1.53V5.75Zm.75 1.6c-.3.06-.5.22-.5.4s.2.34.5.4V7.35Zm0 1.9v.75c.3-.06.5-.22.5-.4s-.2-.34-.5-.4Z" fill="#033AB8" />
    </svg>
  )
}
function PieIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5A6.5 6.5 0 1 0 14.5 8H8V1.5Z" fill="#033AB8" opacity="0.2" />
      <path d="M9.5 1.75V8H14.5A6.51 6.51 0 0 0 9.5 1.75Z" fill="#033AB8" />
    </svg>
  )
}
function TrendingUpIcon({ color = '#29AF0B' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 11L5 7.5l3 3 5.5-6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 4h4v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function TrendingDownIcon({ color = '#F03722' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 5L5 8.5l3-3 5.5 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12h4V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CreditCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M1.5 4.5A1.5 1.5 0 0 1 3 3h10A1.5 1.5 0 0 1 14.5 4.5v7A1.5 1.5 0 0 1 13 13H3A1.5 1.5 0 0 1 1.5 11.5v-7ZM3 4.5V6H13V4.5H3ZM3 7.5v4H13v-4H3Z" fill="#F03722" />
    </svg>
  )
}
function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9 3h4v4M7 13H3V9M13 7v6M3 9V3" stroke="#6E738C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Skeleton primitive ───────────────────────────────────────────────────────
function Sk({ w, h, pill }: { w: string | number; h: string | number; pill?: boolean }) {
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

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{ background: '#FFF', boxShadow: PANEL_SHADOW, borderRadius: '16px', overflow: 'hidden' }}
    >
      {children}
    </div>
  )
}

function CardHead({ icon, title, right }: { icon: React.ReactNode; title: string; right?: React.ReactNode }) {
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

// ─── Simple SVG line chart ────────────────────────────────────────────────────
function LineChart({ points }: { points: DashboardChartPoint[] }) {
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

// ─── Allocation bar ───────────────────────────────────────────────────────────
const ALLOC_COLORS = ['#033AB8', '#6C8EFF', '#B3C4FF', '#D6DFFF', '#EEF2FF']

function AllocationSection({ items, label, currency }: { items: DashboardAllocItem[]; label: string; currency: string }) {
  const total = items.reduce((s, i) => s + i.value, 0)

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0">
      <div className="flex flex-col gap-0.5">
        <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, lineHeight: '26px', color: '#2C2E35' }}>
          {total > 0 ? fmt(total, currency) : '—'}
        </span>
      </div>

      {/* Stacked bar */}
      {items.length > 0 ? (
        <div className="flex gap-0.5 rounded overflow-hidden" style={{ height: '8px' }}>
          {items.map((item, i) => (
            <div key={item.label} style={{ width: `${item.pct}%`, background: ALLOC_COLORS[i % ALLOC_COLORS.length], borderRadius: '2px', minWidth: '4px' }} />
          ))}
        </div>
      ) : (
        <div style={{ height: '8px', background: '#EFF0F5', borderRadius: '4px' }} />
      )}

      {/* Rows */}
      <div className="flex flex-col">
        {items.length > 0 ? (
          items.map((item, i) => (
            <div key={item.label} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: i < items.length - 1 ? '1px solid #EFF0F5' : undefined, height: '40px' }}>
              <div className="flex items-center gap-2">
                <div style={{ width: '4px', height: '12px', background: ALLOC_COLORS[i % ALLOC_COLORS.length], borderRadius: '4px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#2C2E35' }}>{item.label}</span>
                {item.count != null && (
                  <span style={{ fontSize: '11px', color: '#B3B8CB' }}>{item.count}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '12px', color: '#6E738C' }}>{item.pct.toFixed(1)}%</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#2C2E35' }}>{fmt(item.value, currency)}</span>
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="flex items-center justify-between" style={{ height: '40px', borderBottom: '1px solid #EFF0F5' }}>
              <Sk w={80} h={13} />
              <Sk w={48} h={13} />
            </div>
            <div className="flex items-center justify-between" style={{ height: '40px', borderBottom: '1px solid #EFF0F5' }}>
              <Sk w={64} h={13} />
              <Sk w={48} h={13} />
            </div>
            <div className="flex items-center justify-between" style={{ height: '40px' }}>
              <Sk w={72} h={13} />
              <Sk w={48} h={13} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Mover row ────────────────────────────────────────────────────────────────
function MoverRow({ mover, currency, border = true }: { mover: DashboardMover; currency: string; border?: boolean }) {
  const up = (mover.change_pct ?? 0) >= 0
  return (
    <div className="flex items-center justify-between" style={{ padding: '12px 0', height: '64px', borderBottom: border ? '1px solid #EFF0F5' : undefined }}>
      <div className="flex items-center gap-3">
        {mover.logo_url ? (
          <img src={mover.logo_url} alt={mover.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div className="flex items-center justify-center font-semibold text-white" style={{ width: 36, height: 36, borderRadius: '50%', background: '#EFF0F5', fontSize: '13px', color: '#6E738C' }}>
            {mover.name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', lineHeight: '22px' }}>{mover.name}</span>
          {mover.ticker && <span style={{ fontSize: '12px', color: '#6E738C' }}>{mover.ticker}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35' }}>{fmt(mover.current_value, currency)}</span>
        {mover.change_pct != null && (
          <span style={{ fontSize: '12px', fontWeight: 500, color: up ? '#008753' : '#C50F3C' }}>
            {up ? '+' : ''}{mover.change_pct.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Debt row ─────────────────────────────────────────────────────────────────
function DebtRow({ debt, border = true }: { debt: DashboardDebt; border?: boolean }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '12px 0', height: '64px', borderBottom: border ? '1px solid #EFF0F5' : undefined }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFF1F0' }}>
          <CreditCardIcon />
        </div>
        <div className="flex flex-col gap-0.5">
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35' }}>{debt.name}</span>
          <span style={{ fontSize: '12px', color: '#6E738C', textTransform: 'capitalize' }}>{debt.debt_type.replace(/_/g, ' ')}</span>
        </div>
      </div>
      <span style={{ fontSize: '14px', fontWeight: 500, color: '#C50F3C' }}>{fmt(debt.owned_balance, debt.currency)}</span>
    </div>
  )
}

// ─── Welcome modal ────────────────────────────────────────────────────────────
function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: '100px', background: 'rgba(4,1,3,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '426px', background: '#FFF', borderRadius: '16px', boxShadow: MODAL_SHADOW, overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) both' }}>
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

// ─── Nav item ─────────────────────────────────────────────────────────────────
// ─── Currency selector button + dropdown ──────────────────────────────────────
interface CurrencySelectorProps {
  currentCode: string
  portfolioId: string
  onUpdated: () => void
}

function CurrencySelector({ currentCode, portfolioId, onUpdated }: CurrencySelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const { data: currenciesData } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => currencyApi.list().then((r) => r.data.data ?? []),
    staleTime: Infinity,
  })
  const currencies = currenciesData ?? []
  const filtered = search.trim()
    ? currencies.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : currencies

  const qc = useQueryClient()
  const { mutate: updateCurrency, isPending } = useMutation({
    mutationFn: (code: string) => portfolioApi.update(portfolioId, { base_currency: code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolios'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setOpen(false)
      setSearch('')
      onUpdated()
    },
  })

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="flex items-center gap-1.5 hover:opacity-80 active:scale-[0.97] transition-[opacity,transform]"
        style={{
          height: '28px',
          padding: '0 8px',
          borderRadius: '6px',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)',
          boxShadow: BTN_SHADOW,
          border: 'none',
          cursor: isPending ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {/* Flag */}
        <span style={{ fontSize: '12px', lineHeight: 1 }}>{currencyFlag(currentCode)}</span>
        {/* Code */}
        <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.1px', color: '#2C2E35' }}>
          {currentCode}
        </span>
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
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search */}
          <div style={{ padding: '8px 8px 4px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search currency…"
              autoFocus
              style={{
                width: '100%',
                height: '28px',
                padding: '0 8px',
                borderRadius: '6px',
                background: '#EFF0F5',
                border: 'none',
                fontSize: '12px',
                color: '#2C2E35',
                outline: 'none',
              }}
            />
          </div>
          {/* List */}
          <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '2px 4px 4px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 8px', fontSize: '12px', color: '#B3B8CB', textAlign: 'center' }}>
                No results
              </div>
            ) : (
              filtered.map((c) => {
                const isSelected = c.code === currentCode
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => updateCurrency(c.code)}
                    className="flex items-center gap-2 w-full hover:bg-[#EFF0F5] transition-colors"
                    style={{
                      padding: '5px 8px',
                      height: '32px',
                      borderRadius: '6px',
                      border: 'none',
                      background: isSelected ? '#EFF0F5' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '13px', lineHeight: 1 }}>{currencyFlag(c.code)}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#6E738C', width: '32px', flexShrink: 0 }}>{c.code}</span>
                    <span style={{ fontSize: '12px', color: '#2C2E35', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.name}</span>
                    {isSelected && <span style={{ fontSize: '10px', color: '#033AB8' }}>✓</span>}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Quick Actions dropdown ────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: 'add', label: 'Add asset',     active: true  },
  { icon: 'add', label: 'Add debt',      active: false },
  { icon: 'add', label: 'Add portfolio', active: false },
  { icon: 'add', label: 'Invite member', active: false },
  { icon: 'upload', label: 'Import data', active: false },
] as const

function QuickActionsMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

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
                onClick={isAddAsset ? () => { setOpen(false); navigate({ to: '/assets' }) } : undefined}
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

// ─── Empty state (data_status = "empty") ──────────────────────────────────────
function EmptyState({ portfolioName }: { portfolioName: string }) {
  const navigate = useNavigate()
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
        onClick={() => navigate({ to: '/assets' })}
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

// ─── Net worth card ───────────────────────────────────────────────────────────
function NetWorthCard({
  nw, chartPoints, period, onPeriod,
}: {
  nw: DashboardNetWorth
  chartPoints: DashboardChartPoint[]
  period: UIPeriod
  onPeriod: (p: UIPeriod) => void
}) {
  const up = (nw.change_pct ?? 0) >= 0
  return (
    <Card>
      <CardHead icon={<CoinIcon />} title="Net Worth" />
      {/* Stats */}
      <div className="flex items-end justify-between" style={{ padding: '16px 16px 0' }}>
        <div className="flex flex-col gap-1">
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 700, lineHeight: '36px', letterSpacing: '-0.3px', color: '#2C2E35' }}>
            {fmt(nw.total, nw.currency)}
          </span>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: '12px', color: '#6E738C' }}>Total net worth</span>
            {nw.change_pct != null && (
              <>
                <span style={{ fontSize: '12px', color: '#B3B8CB' }}>·</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: up ? '#008753' : '#C50F3C' }}>
                  {up ? '+' : ''}{nw.change_pct.toFixed(2)}% this period
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-8">
          {([['#008753', 'Assets', nw.assets], ['#C50F3C', 'Liabilities', nw.debts]] as const).map(([color, label, val]) => (
            <div key={label} className="flex items-center gap-2">
              <div style={{ width: '4px', height: '40px', background: color, borderRadius: '16px', flexShrink: 0 }} />
              <div className="flex flex-col gap-1.5">
                <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px' }}>{label}</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{fmt(val, nw.currency)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chart + tabs */}
      <div style={{ padding: '16px' }}>
        <LineChart points={chartPoints} />
        <div className="flex items-center justify-center" style={{ gap: '2px', marginTop: '8px' }}>
          {PERIODS.map(({ label }) => (
            <button key={label} type="button" onClick={() => onPeriod(label)}
              style={{ padding: '5px 10px', height: '24px', borderRadius: '8px', background: label === period ? '#EFF0F5' : 'transparent', fontSize: '12px', fontWeight: label === period ? 600 : 500, color: label === period ? '#2C2E35' : '#6E738C', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ─── Allocation card ──────────────────────────────────────────────────────────
function AllocationCard({ allocation, currency }: { allocation: DashboardResponse['allocation']; currency: string }) {
  return (
    <Card>
      <CardHead icon={<PieIcon />} title="Asset Allocation" />
      <div className="flex" style={{ padding: '16px', gap: '24px' }}>
        <AllocationSection items={allocation.assets} label="Assets" currency={currency} />
        <div style={{ width: '1px', background: '#EFF0F5', flexShrink: 0 }} />
        <AllocationSection items={allocation.debts} label="Liabilities" currency={currency} />
      </div>
    </Card>
  )
}

// ─── Movers card ──────────────────────────────────────────────────────────────
function MoversCard({ title, icon, movers, currency, emptyMsg }: { title: string; icon: React.ReactNode; movers: DashboardMover[]; currency: string; emptyMsg: string }) {
  return (
    <Card className="flex-1">
      <CardHead icon={icon} title={title} />
      <div style={{ padding: '0 16px 8px' }}>
        {movers.length > 0 ? (
          movers.map((m, i) => <MoverRow key={m.asset_id} mover={m} currency={currency} border={i < movers.length - 1} />)
        ) : (
          <div className="flex items-center justify-center" style={{ height: '120px' }}>
            <span style={{ fontSize: '13px', color: '#B3B8CB', textAlign: 'center' }}>{emptyMsg}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Liabilities card ────────────────────────────────────────────────────────
function LiabilitiesCard({ debts, nw }: { debts: DashboardDebt[]; nw: DashboardNetWorth }) {
  return (
    <Card>
      <CardHead icon={<CreditCardIcon />} title="Liabilities" />
      <div style={{ padding: '16px' }}>
        {/* Summary */}
        <div className="flex items-start justify-between" style={{ marginBottom: '16px' }}>
          <div className="flex flex-col gap-1">
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, lineHeight: '32px', letterSpacing: '-0.1px', color: '#2C2E35' }}>{fmt(nw.debts, nw.currency)}</span>
            <span style={{ fontSize: '12px', color: '#6E738C' }}>Total outstanding</span>
          </div>
        </div>
        {debts.length > 0 ? (
          debts.map((d, i) => <DebtRow key={d.debt_id} debt={d} border={i < debts.length - 1} />)
        ) : (
          <div className="flex items-center justify-center" style={{ height: '100px' }}>
            <span style={{ fontSize: '13px', color: '#B3B8CB' }}>No liabilities yet</span>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function DashboardSkeleton() {
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

// ─── Main page ────────────────────────────────────────────────────────────────
const WELCOME_KEY = 'silo:welcome-shown'

export function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [activePeriod, setActivePeriod] = useState<UIPeriod>('1M')
  const [showWelcome, setShowWelcome] = useState(false)

  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const userInitials = user ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() : '?'

  // 1. Fetch portfolio list
  const { data: portfolios, isLoading: loadingPortfolios } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => portfolioApi.list().then((r) => r.data.data?.items ?? []),
    staleTime: 5 * 60_000,
  })
  const firstPortfolio = portfolios?.[0] ?? null
  const avatarId: AvatarId = firstPortfolio?.image_url?.startsWith('avatar:')
    ? (firstPortfolio.image_url.slice(7) as AvatarId)
    : 'lime'

  // 2. Map UI period → API period string
  const apiPeriod = PERIODS.find((p) => p.label === activePeriod)?.api ?? '1M'

  // 3. Fetch dashboard (enabled only once we have a portfolio ID)
  const { data: dashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: ['dashboard', firstPortfolio?.id, apiPeriod],
    queryFn: () => dashboardApi.get(firstPortfolio!.id, apiPeriod).then((r) => r.data.data!),
    enabled: !!firstPortfolio?.id,
    staleTime: 60_000,
  })

  const isLoading = loadingPortfolios || (!!firstPortfolio && loadingDashboard)

  // Show welcome once
  useEffect(() => {
    if (!localStorage.getItem(WELCOME_KEY)) {
      const t = setTimeout(() => setShowWelcome(true), 200)
      return () => clearTimeout(t)
    }
  }, [])

  const handleCloseWelcome = () => {
    setShowWelcome(false)
    localStorage.setItem(WELCOME_KEY, '1')
  }

  const handleLogout = () => {
    clearAuth()
    navigate({ to: '/login' })
  }

  const lastSync = dashboard?.last_synced_at
    ? new Date(dashboard.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex" style={{ minHeight: '100dvh', background: '#F9F9FB', fontFamily: 'var(--font-sans)' }}>
      {/* ── Sidebar ── */}
      <Sidebar
        portfolioName={firstPortfolio?.name ?? 'My portfolio'}
        avatarId={avatarId}
        activeSection="dashboard"
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onLogout={handleLogout}
      />

      {/* ── Main panel ── */}
      <div className="flex-1 flex flex-col overflow-y-auto" style={{ background: '#FFF', boxShadow: PANEL_SHADOW, borderRadius: '16px 0 0 16px', minHeight: '100dvh' }}>

        {/* ── Header ── */}
        <header className="flex items-center justify-between shrink-0" style={{ padding: '12px 40px', height: '56px', borderBottom: '1px solid #EFF0F5', position: 'sticky', top: 0, background: '#FFF', zIndex: 10 }}>
          {/* Search */}
          <div className="flex items-center gap-2" style={{ width: '400px', height: '32px', padding: '0 12px', background: '#EFF0F5', borderRadius: '10px', cursor: 'text' }}>
            <SearchIcon />
            <span style={{ fontSize: '14px', color: '#6E738C', flex: 1 }}>Search</span>
            <span style={{ fontSize: '11px', fontWeight: 500, color: '#B3B8CB', background: '#E3E5ED', borderRadius: '4px', padding: '1px 5px' }}>⌘K</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-6">
            {/* Refresh + timestamp */}
            <div className="flex items-center gap-1.5">
              <RefreshIcon />
              <span style={{ fontSize: '12px', color: '#6E738C' }}>
                {lastSync ? `Last synced ${lastSync}` : 'Last updated just now'}
              </span>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-3">
              {/* Currency selector */}
              {firstPortfolio && (
                <CurrencySelector
                  currentCode={firstPortfolio.base_currency}
                  portfolioId={firstPortfolio.id}
                  onUpdated={() => qc.invalidateQueries({ queryKey: ['dashboard'] })}
                />
              )}

              {/* User avatar */}
              <div
                className="flex items-center justify-center font-semibold text-white"
                style={{ width: '20px', height: '20px', borderRadius: '33px', background: '#033AB8', fontSize: '8px', flexShrink: 0, letterSpacing: '0.3px' }}
              >
                {userInitials}
              </div>

              {/* Invite — visual placeholder */}
              <button
                type="button"
                className="flex items-center justify-center text-white font-semibold hover:opacity-90 active:scale-[0.97] transition-[opacity,transform]"
                style={{ width: '54px', height: '28px', borderRadius: '6px', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', fontSize: '12px', border: 'none', cursor: 'pointer' }}
              >
                Invite
              </button>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        {isLoading ? (
          <DashboardSkeleton />
        ) : dashboard?.data_status === 'empty' || !dashboard ? (
          <>
            {/* Section heading even in empty state */}
            <div className="flex items-end justify-between" style={{ padding: '28px 40px 0' }}>
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', color: '#6E738C' }}>Portfolio</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: '#2C2E35' }}>
                  {firstPortfolio?.name ?? 'Dashboard'}
                </span>
              </div>
              <QuickActionsMenu />
            </div>
            <EmptyState portfolioName={firstPortfolio?.name ?? 'Your portfolio'} />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '40px', animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
            {/* Section header */}
            <div className="flex items-end justify-between" style={{ padding: '28px 40px 20px' }}>
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', color: '#6E738C' }}>Portfolio</span>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, lineHeight: '28px', color: '#2C2E35' }}>
                    {firstPortfolio?.name ?? 'Dashboard'}
                  </span>
                  {/* Insufficient history badge */}
                  {dashboard.data_status === 'insufficient_history' && (
                    <div className="flex items-center gap-1.5" style={{ padding: '2px 8px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '20px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                      <span style={{ fontSize: '11px', color: '#92400E', fontWeight: 500 }}>No history for this period</span>
                    </div>
                  )}
                </div>
              </div>
              <QuickActionsMenu />
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 40px' }}>
              {/* Net worth */}
              <NetWorthCard
                nw={dashboard.net_worth}
                chartPoints={dashboard.chart.points}
                period={activePeriod}
                onPeriod={setActivePeriod}
              />

              {/* Allocation */}
              <AllocationCard
                allocation={dashboard.allocation}
                currency={dashboard.net_worth.currency}
              />

              {/* Movers row */}
              <div className="flex gap-4">
                <MoversCard
                  title="Top Gainers"
                  icon={<TrendingUpIcon color="#29AF0B" />}
                  movers={dashboard.top_movers.gainers}
                  currency={dashboard.net_worth.currency}
                  emptyMsg="No gainers in this period"
                />
                <MoversCard
                  title="Top Losers"
                  icon={<TrendingDownIcon color="#F03722" />}
                  movers={dashboard.top_movers.losers}
                  currency={dashboard.net_worth.currency}
                  emptyMsg="No losers in this period"
                />
              </div>

              {/* Liabilities */}
              <LiabilitiesCard debts={dashboard.debts} nw={dashboard.net_worth} />
            </div>
          </div>
        )}
      </div>

      {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}
    </div>
  )
}
