import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AvatarId } from '@/components/AvatarPicker'
import { Sidebar } from '@/components/AppSidebar'
import { portfolioApi, currencyApi, folderApi, assetApi, uploadApi, autopilotApi } from '@/lib/api'
import type { Folder, TickerSearchResult, TickerQuote, AssetItem, AssetNote, AssetDocument, AssetLot, AutopilotRule } from '@/types/api'
import { useAuthStore } from '@/store/auth'

// ─── Design tokens ────────────────────────────────────────────────────────────
const PANEL_SHADOW =
  '0px 2px 2px -1px rgba(17,29,80,0.04), 0px 4px 2px -1px rgba(17,29,80,0.04), 0px 0px 0px 0.5px rgba(17,29,80,0.12)'
const BTN_SHADOW =
  '0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.1)'
const DROPDOWN_SHADOW =
  '0px 8px 8px -1px rgba(17,29,80,0.06), 0px 4px 4px -2px rgba(17,29,80,0.04), 0px 2px 2px -1px rgba(17,29,80,0.04), 0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.08)'

// ─── Utilities ────────────────────────────────────────────────────────────────
function fmt(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

function currencyFlag(code: string): string {
  const cc = code.slice(0, 2).toUpperCase()
  return [...cc]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
}

// ─── Asset type labels ────────────────────────────────────────────────────────
const ASSET_TYPE_LABELS: Record<string, string> = {
  stock_ticker: 'Stock',
  stock_manual: 'Stock',
  crypto_ticker: 'Crypto',
  crypto_manual: 'Crypto',
  real_estate: 'Real Estate',
  domain: 'Domain',
  physical: 'Physical Valuable',
  venture_capital: 'Venture Capital',
  business: 'Business',
  bank: 'Bank Connection',
  crypto_wallet: 'Crypto Wallet',
  manual: 'Manual',
}

// ─── Folder tab colors ────────────────────────────────────────────────────────
const FOLDER_TAB_COLORS = ['#1A56DB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2']

// ─── Icons ────────────────────────────────────────────────────────────────────
function SearchIcon({ size = 16, color = '#6E738C' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 2a5 5 0 1 0 3.17 8.87l2.47 2.47a.75.75 0 1 0 1.06-1.06L11.23 9.8A5 5 0 0 0 7 2Zm-3.5 5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
        fill={color}
      />
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
function ChevronDownIcon({ size = 12, color = '#6E738C' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CloseIcon({ color = '#6E738C', size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4L4 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function PlusCircleIcon({ color = '#033AB8', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM6.25 4.75a.75.75 0 0 1 1.5 0V6.25H9.25a.75.75 0 0 1 0 1.5H7.75V9.25a.75.75 0 0 1-1.5 0V7.75H4.75a.75.75 0 0 1 0-1.5H6.25V4.75Z"
        fill={color}
      />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 1.5a.75.75 0 0 1 .75.75V3h4.5V2.25a.75.75 0 0 1 1.5 0V3H13A1.5 1.5 0 0 1 14.5 4.5v9A1.5 1.5 0 0 1 13 15H3A1.5 1.5 0 0 1 1.5 13.5v-9A1.5 1.5 0 0 1 3 3h1.25V2.25A.75.75 0 0 1 5 1.5ZM3 6v7.5h10V6H3Z"
        fill="#6E738C"
      />
    </svg>
  )
}
function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="4" cy="8" r="1.2" fill="#6E738C" />
      <circle cx="8" cy="8" r="1.2" fill="#6E738C" />
      <circle cx="12" cy="8" r="1.2" fill="#6E738C" />
    </svg>
  )
}
function SortIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 2v8M3.5 4.5L6 2l2.5 2.5M3.5 7.5L6 10l2.5-2.5" stroke="#B3B8CB" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1v8M3.5 5.5L7 9l3.5-3.5M2 10v1.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V10" stroke="#6E738C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function EyeIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M1 6.5C1 6.5 3 2.5 6.5 2.5S12 6.5 12 6.5 10 10.5 6.5 10.5 1 6.5 1 6.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.1"/>
    </svg>
  )
}
function EyeOffIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M1.5 1.5l10 10M5.5 5.6A1.5 1.5 0 0 0 7.4 7.5M3.2 3.3C2 4.2 1 6.5 1 6.5s2 4 5.5 4c1.1 0 2-.3 2.8-.8M10 9.8C11.1 8.9 12 6.5 12 6.5S10 2.5 6.5 2.5c-.9 0-1.7.2-2.4.6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Asset type icons (for modal) ─────────────────────────────────────────────
function StockTickerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 11l3-4 3 2 3-5 3 3" stroke="#033AB8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 14h12" stroke="#033AB8" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
function CryptoTickerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#033AB8" strokeWidth="1.3" />
      <path d="M6.5 5.5h3a1.5 1.5 0 0 1 0 3h-3v-3ZM6.5 8.5h3.5a1.5 1.5 0 0 1 0 3H6.5v-3Z" stroke="#033AB8" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M7.5 5v-1M8.5 5v-1M7.5 12v-1M8.5 12v-1" stroke="#033AB8" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}
function RealEstateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 14V7.5L8 2l6 5.5V14" stroke="#033AB8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 14v-4h4v4" stroke="#033AB8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function DomainsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#033AB8" strokeWidth="1.3" />
      <path d="M8 2c-2 2-2 10 0 12M8 2c2 2 2 10 0 12M2 8h12" stroke="#033AB8" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}
function PhysicalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L5 6h6L8 2ZM5 6l-2 4h10L11 6H5ZM3 10l2 4h6l2-4H3Z" stroke="#033AB8" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}
function VentureCapitalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 13V9M6 13V7M9 13V5M12 13V3" stroke="#033AB8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 5l3-2M12 3l-1 1" stroke="#033AB8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function BusinessIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="7" width="12" height="7" rx="1" stroke="#033AB8" strokeWidth="1.3" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="#033AB8" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 10v2" stroke="#033AB8" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
function BankConnectionsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 13h12M3 13V8M6 13V8M10 13V8M13 13V8" stroke="#033AB8" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M2 6l6-4 6 4H2Z" stroke="#033AB8" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  )
}
function CryptoWalletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="#033AB8" strokeWidth="1.3" />
      <path d="M10 8.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z" fill="#033AB8" />
      <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="#033AB8" strokeWidth="1.1" />
    </svg>
  )
}
function ManualAssetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="2.5" width="11" height="11" rx="2" stroke="#033AB8" strokeWidth="1.3" />
      <path d="M8 5.5v5M5.5 8h5" stroke="#033AB8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ─── Asset type config (for modal) ────────────────────────────────────────────
interface AssetTypeConfig {
  id: string
  label: string
  icon: React.ReactNode
  enabled: boolean
}
const ASSET_TYPES: AssetTypeConfig[] = [
  { id: 'stock_ticker', label: 'Stocks', icon: <StockTickerIcon />, enabled: true },
  { id: 'crypto_ticker', label: 'Crypto', icon: <CryptoTickerIcon />, enabled: false },
  { id: 'real_estate', label: 'Real Estate', icon: <RealEstateIcon />, enabled: false },
  { id: 'domain', label: 'Domains', icon: <DomainsIcon />, enabled: false },
  { id: 'physical', label: 'Physical Valuables', icon: <PhysicalIcon />, enabled: false },
  { id: 'venture_capital', label: 'Venture Capital', icon: <VentureCapitalIcon />, enabled: false },
  { id: 'business', label: 'Business', icon: <BusinessIcon />, enabled: false },
  { id: 'bank', label: 'Bank Connections', icon: <BankConnectionsIcon />, enabled: false },
  { id: 'crypto_wallet', label: 'Crypto Wallets', icon: <CryptoWalletIcon />, enabled: false },
  { id: 'manual', label: 'Manual Assets', icon: <ManualAssetIcon />, enabled: false },
]

// ─── Yahoo Finance attribution ────────────────────────────────────────────────
function YahooAttribution() {
  return (
    <div className="flex items-center gap-1.5" style={{ marginTop: 'auto', paddingTop: '16px' }}>
      <span style={{ fontSize: '11px', color: '#B3B8CB' }}>Powered by</span>
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#6E738C' }}>Yahoo Finance</span>
    </div>
  )
}

// ─── Modal step 1: Choose asset type ─────────────────────────────────────────
function TypeSelectStep({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (id: string) => void
}) {
  const rows: AssetTypeConfig[][] = []
  for (let i = 0; i < ASSET_TYPES.length; i += 2) rows.push(ASSET_TYPES.slice(i, i + 2))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: '32px' }}>
      <div style={{ width: '544px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: '#2C2E35' }}>
            Choose an Asset Type
          </span>
          <span style={{ fontSize: '14px', lineHeight: '22px', color: '#6E738C' }}>
            Specify the type of asset you want to add.
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: '8px' }}>
              {row.map((type) => {
                const isActive = selected === type.id
                return (
                  <button key={type.id} type="button" onClick={() => onSelect(type.id)}
                    className="flex items-center gap-3 transition-all"
                    style={{
                      flex: 1, height: '52px', padding: '12px', borderRadius: '12px',
                      border: `1px solid ${isActive ? '#033AB8' : '#EFF0F5'}`,
                      background: isActive ? '#F0F4FF' : '#FFF',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '40px', background: '#ECF7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {type.icon}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', flex: 1 }}>{type.label}</span>
                    {!type.enabled && (
                      <span style={{ fontSize: '10px', fontWeight: 500, color: '#B3B8CB', background: '#F0F0F5', borderRadius: '4px', padding: '2px 6px', flexShrink: 0 }}>
                        soon
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Modal step 2: Search for a stock ────────────────────────────────────────
function StockSearchStep({
  portfolioId,
  selected,
  onSelect,
  onAddManually,
}: {
  portfolioId: string
  selected: TickerSearchResult | null
  onSelect: (t: TickerSearchResult | null) => void
  onAddManually: () => void
}) {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), 350)
    return () => clearTimeout(t)
  }, [input])

  const { data: results, isFetching } = useQuery({
    queryKey: ['ticker-search', portfolioId, query],
    queryFn: () => assetApi.searchTicker(portfolioId, query, 'stock').then((r) => r.data.data ?? []),
    enabled: query.length >= 1 && !!portfolioId,
    staleTime: 30_000,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: '32px' }}>
      <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: '#2C2E35' }}>
            Search for a Stock
          </span>
          <span style={{ fontSize: '14px', lineHeight: '22px', color: '#6E738C' }}>
            Add publicly traded stocks by ticker symbol. Prices update automatically so you always see current values.
          </span>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2" style={{ width: '100%', height: '40px', padding: '0 12px', background: '#EFF0F5', borderRadius: '10px' }}>
          <SearchIcon />
          <input
            type="text" value={input} onChange={(e) => { setInput(e.target.value); if (selected) onSelect(null) }}
            placeholder="Search by name or ticker..." autoFocus
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', color: '#2C2E35' }}
          />
          {input && (
            <button type="button" onClick={() => { setInput(''); onSelect(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <CloseIcon size={14} />
            </button>
          )}
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Add manually row */}
          <button type="button" onClick={onAddManually}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            style={{ width: '100%', height: '72px', padding: '12px 16px', borderRadius: '12px', background: '#F9F9FB', border: '1px solid #EFF0F5', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ECF7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PlusCircleIcon color="#033AB8" size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#2C2E35' }}>Add manually</span>
              <span style={{ fontSize: '12px', color: '#6E738C' }}>Enter stock details manually</span>
            </div>
          </button>

          {query.length >= 1 && isFetching && (
            <div className="flex items-center justify-center" style={{ height: '60px', color: '#B3B8CB', fontSize: '13px' }}>Searching...</div>
          )}
          {query.length >= 1 && !isFetching && results && results.length === 0 && (
            <div className="flex items-center justify-center" style={{ height: '60px', color: '#B3B8CB', fontSize: '13px' }}>No results for "{query}"</div>
          )}
          {results?.map((ticker) => {
            const isSelected = selected?.ticker === ticker.ticker
            return (
              <button key={ticker.ticker} type="button" onClick={() => onSelect(ticker)}
                className="flex items-center gap-3 transition-all"
                style={{ width: '100%', height: '72px', padding: '12px 16px', borderRadius: '12px', background: isSelected ? '#F0F4FF' : '#FFF', border: `1px solid ${isSelected ? '#033AB8' : '#EFF0F5'}`, cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid #EFF0F5', overflow: 'hidden', flexShrink: 0, background: '#F9F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {ticker.logo_url ? (
                    <img src={ticker.logo_url} alt={ticker.ticker} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#6E738C' }}>{ticker.ticker.slice(0, 2)}</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#2C2E35', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticker.company_name}</span>
                  <span style={{ fontSize: '12px', color: '#6E738C' }}>{ticker.ticker} · {ticker.exchange}</span>
                </div>
              </button>
            )
          })}
          {query.length < 1 && (
            <div className="flex items-center justify-center" style={{ height: '60px', color: '#B3B8CB', fontSize: '13px' }}>Type a company name or ticker to search</div>
          )}
        </div>

        <YahooAttribution />
      </div>
    </div>
  )
}

// ─── Modal step 3a: Add stock manually ───────────────────────────────────────
export interface ManualStockForm {
  name: string
  ticker: string
  price: string
  currency: string
  lots: Array<{ quantity: string; date: string }>
  imageUrl: string | null
}

function ManualStockStep({
  form,
  onChange,
  creating,
  onSubmit,
  error,
}: {
  form: ManualStockForm
  onChange: (f: ManualStockForm) => void
  creating: boolean
  onSubmit: () => void
  error?: string | null
}) {
  const set = (key: 'name' | 'ticker' | 'price' | 'currency') => (val: string) => onChange({ ...form, [key]: val })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const res = await uploadApi.upload(file)
      onChange({ ...form, imageUrl: res.data.data.url })
    } catch {
      setUploadError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const price = parseFloat(form.price)
  const totalQty = form.lots.reduce((s, l) => s + (parseFloat(l.quantity) || 0), 0)
  const totalValue = !isNaN(price) && price > 0 && totalQty > 0 ? price * totalQty : null
  const isValid =
    form.name.trim() !== '' &&
    form.price !== '' && !isNaN(price) && price > 0 &&
    form.lots.length > 0 &&
    form.lots.every((l) => l.quantity !== '' && parseFloat(l.quantity) > 0 && l.date !== '')

  const fmtManual = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: form.currency || 'USD', maximumFractionDigits: 2 }).format(v)

  const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'NGN', 'GHS', 'KES', 'ZAR']
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const currencyRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!currencyOpen) return
    const h = (e: MouseEvent) => { if (!currencyRef.current?.contains(e.target as Node)) setCurrencyOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [currencyOpen])

  const addLot = () => onChange({ ...form, lots: [...form.lots, { quantity: '', date: '' }] })
  const removeLot = (idx: number) => onChange({ ...form, lots: form.lots.filter((_, i) => i !== idx) })
  const updateLot = (idx: number, key: 'quantity' | 'date', val: string) => {
    const lots = form.lots.map((l, i) => i === idx ? { ...l, [key]: val } : l)
    onChange({ ...form, lots })
  }

  const field = (label: string, required: boolean, children: React.ReactNode, hint?: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <label style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{label}</label>
        {required && <span style={{ fontSize: '14px', color: '#F03722' }}>*</span>}
      </div>
      {children}
      {hint && (
        <div className="flex items-center gap-1" style={{ gap: '4px' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#B3B8CB" strokeWidth="1"/><path d="M6 5.5v3M6 4h.01" stroke="#B3B8CB" strokeWidth="1" strokeLinecap="round"/></svg>
          <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px' }}>{hint}</span>
        </div>
      )}
    </div>
  )

  const inputStyle: React.CSSProperties = {
    height: '40px', padding: '0 16px', background: '#F9F9FB', borderRadius: '12px',
    border: 'none', fontSize: '14px', color: '#2C2E35', outline: 'none', width: '100%',
    letterSpacing: '-0.1px',
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* ── Left: form ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', overflowY: 'auto', background: '#FFF', borderRight: '1px solid #EFF0F5' }}>
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── Header: logo + title ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            {/* Upload logo */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div
              style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0, cursor: 'pointer' }}
              onClick={() => !uploading && fileInputRef.current?.click()}
              title="Upload image"
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '9999px', background: '#EFF0F5', border: '1px solid #EFF0F5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {uploading ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="10" cy="10" r="8" stroke="#B3B8CB" strokeWidth="2"/>
                    <path d="M10 2a8 8 0 0 1 8 8" stroke="#033AB8" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : form.imageUrl ? (
                  <img src={form.imageUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6E738C" strokeWidth="1.5"/>
                    <path d="M3 16l4.5-4.5 3 3 4-5 4.5 6.5" stroke="#6E738C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="8.5" cy="10" r="1.5" fill="#6E738C"/>
                  </svg>
                )}
              </div>
              <div style={{ position: 'absolute', right: 0, bottom: 0, width: '22px', height: '22px', borderRadius: '9999px', background: '#FFF', boxShadow: PANEL_SHADOW, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                {form.imageUrl ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 9l2.5-2.5L9 1l2 2-5.5 5.5L3 11l-2-2z" stroke="#033AB8" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 8V3M4 5l2-2 2 2" stroke="#6E738C" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 10h8" stroke="#6E738C" strokeWidth="1.1" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
            </div>
            {uploadError && <span style={{ fontSize: '12px', color: '#F03722' }}>{uploadError}</span>}
            {/* Dynamic title */}
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, lineHeight: '32px', letterSpacing: '-0.1px', color: '#2C2E35', textAlign: 'center' }}>
              Add {form.name.trim() || '___'} stock
            </span>
            <span style={{ fontSize: '14px', lineHeight: '22px', letterSpacing: '-0.1px', color: '#6E738C', textAlign: 'center' }}>
              Manually track your stock position
            </span>
          </div>

          {/* ── Stock Name ── */}
          {field('Stock Name', true,
            <div style={{ background: '#F9F9FB', borderRadius: '12px', overflow: 'hidden' }}>
              <input type="text" value={form.name} onChange={(e) => set('name')(e.target.value)}
                placeholder="e.g. Apple Inc." style={inputStyle} autoFocus />
            </div>
          )}

          {/* ── Ticker ── */}
          {field('Ticker', false,
            <div style={{ background: '#F9F9FB', borderRadius: '12px', overflow: 'hidden' }}>
              <input type="text" value={form.ticker} onChange={(e) => set('ticker')(e.target.value.toUpperCase())}
                placeholder="e.g. AAPL (optional)" style={inputStyle} />
            </div>
          )}

          {/* ── Current Price ── */}
          {field('Current Price', true,
            <div style={{ display: 'flex', background: '#F9F9FB', borderRadius: '12px', overflow: 'hidden', height: '40px' }}>
              {/* Currency picker */}
              <div ref={currencyRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button type="button" onClick={() => setCurrencyOpen((o) => !o)}
                  style={{ height: '40px', padding: '8px 12px', borderRadius: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', minWidth: '92px' }}>
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>{currencyFlag(form.currency)}</span>
                  <span style={{ fontSize: '14px', color: '#2C2E35', letterSpacing: '-0.1px' }}>{form.currency}</span>
                  <ChevronDownIcon size={10} />
                </button>
                {currencyOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: '#FFF', boxShadow: DROPDOWN_SHADOW, borderRadius: '10px', zIndex: 50, padding: '4px', minWidth: '110px' }}>
                    {COMMON_CURRENCIES.map((c) => (
                      <button key={c} type="button"
                        onClick={() => { set('currency')(c); setCurrencyOpen(false) }}
                        className="flex items-center gap-2 w-full hover:bg-[#F9F9FB] transition-colors"
                        style={{ padding: '5px 8px', height: '30px', borderRadius: '6px', border: 'none', background: c === form.currency ? '#EFF0F5' : 'transparent', fontSize: '13px', color: '#2C2E35', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ fontSize: '12px' }}>{currencyFlag(c)}</span>
                        <span>{c}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input type="number" min="0" step="any" value={form.price}
                onChange={(e) => set('price')(e.target.value)}
                placeholder="0.00"
                style={{ ...inputStyle, flex: 1, borderRadius: 0, padding: '8px 16px' }} />
            </div>
          )}

          {/* ── Divider ── */}
          <div style={{ height: '1px', background: '#EFF0F5', margin: '4px 0' }} />

          {/* ── Lots ── */}
          {form.lots.map((lot, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {idx > 0 && (
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#6E738C', letterSpacing: '0.1px' }}>Lot {idx + 1}</span>
                  <button type="button" onClick={() => removeLot(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    <CloseIcon size={14} color="#B3B8CB" />
                  </button>
                </div>
              )}
              {field('Quantity', true,
                <div style={{ background: '#F9F9FB', borderRadius: '12px', overflow: 'hidden' }}>
                  <input type="number" min="0" step="any" value={lot.quantity}
                    onChange={(e) => updateLot(idx, 'quantity', e.target.value)}
                    placeholder="0" style={inputStyle} />
                </div>,
                'Number of shares you hold for this position'
              )}
              {field('Acquisition Date', true,
                <div style={{ background: '#F9F9FB', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                  <input type="date" value={lot.date}
                    onChange={(e) => updateLot(idx, 'date', e.target.value)}
                    style={{ ...inputStyle, padding: '0 40px 0 16px', colorScheme: 'light', color: lot.date ? '#2C2E35' : '#B3B8CB' }} />
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <CalendarIcon />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* ── Add another lot ── */}
          <button type="button" onClick={addLot}
            className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            style={{ height: '28px', padding: '8px 0', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <PlusCircleIcon size={12} color="#033AB8" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#033AB8', lineHeight: '18px' }}>Add another lot</span>
          </button>
        </div>
      </div>

      {/* ── Right: Asset Summary ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', overflowY: 'auto', background: '#F9F9FB' }}>
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, lineHeight: '28px', color: '#2C2E35' }}>Asset Summary</span>

          <div style={{ background: '#EFF0F5', borderRadius: '16px', overflow: 'hidden' }}>
            {([
              { label: 'Company', value: form.name || '—' },
              { label: 'Ticker', value: form.ticker || '—' },
              { label: 'Current Price', value: form.price && !isNaN(price) && price > 0 ? `${fmtManual(price)} ${form.currency}` : '—' },
              { label: 'Exchange', value: 'Manual' },
              { label: 'Total Value', value: totalValue != null ? fmtManual(totalValue) : '—', valueBold: true },
            ] as Array<{ label: string; value: string; valueBold?: boolean }>).map((row, i, arr) => (
              <div key={row.label} className="flex items-center justify-between"
                style={{ height: '46px', padding: '0 16px', borderBottom: i < arr.length - 1 ? '1px solid #E3E5ED' : 'none' }}>
                <span style={{ fontSize: '13px', color: '#6E738C', letterSpacing: '-0.1px' }}>{row.label}</span>
                <span style={{ fontSize: '13px', fontWeight: row.valueBold ? 600 : 500, color: '#2C2E35', letterSpacing: row.valueBold ? undefined : '0.1px' }}>{row.value}</span>
              </div>
            ))}
          </div>

          <button type="button" onClick={onSubmit} disabled={!isValid || creating}
            className="transition-all"
            style={{ width: '100%', height: '32px', borderRadius: '10px', border: 'none', cursor: isValid && !creating ? 'pointer' : 'not-allowed', background: isValid && !creating ? 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)' : '#E3E5ED', color: isValid && !creating ? '#FFF' : '#B3B8CB', fontSize: '13px', fontWeight: 600, lineHeight: '20px' }}>
            {creating ? 'Adding...' : `Add ${form.name.trim() || 'Asset'}`}
          </button>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
              <span style={{ fontSize: '13px', color: '#C50F3C' }}>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal step 3b: Add stock details (ticker flow) ───────────────────────────
interface Lot { quantity: string; date: string }

function StockDetailsStep({
  portfolioId, ticker, lots, onLotsChange, creating, onSubmit,
}: {
  portfolioId: string
  ticker: TickerSearchResult
  lots: Lot[]
  onLotsChange: (lots: Lot[]) => void
  creating: boolean
  onSubmit: () => void
}) {
  const { data: quote } = useQuery<TickerQuote>({
    queryKey: ['ticker-preview', portfolioId, ticker.ticker],
    queryFn: () => assetApi.previewTicker(portfolioId, ticker.ticker).then((r) => r.data.data!),
    enabled: !!portfolioId,
    staleTime: 60_000,
  })

  const isFormValid = lots.every((l) => l.quantity !== '' && parseFloat(l.quantity) > 0 && l.date !== '')
  const updateLot = (idx: number, field: keyof Lot, value: string) =>
    onLotsChange(lots.map((l, i) => (i === idx ? { ...l, [field]: value } : l)))
  const addLot = () => onLotsChange([...lots, { quantity: '', date: '' }])
  const removeLot = (idx: number) => onLotsChange(lots.filter((_, i) => i !== idx))

  const changePct = quote?.pct_change ?? 0
  const changePositive = changePct >= 0

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* ── Left panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', overflowY: 'auto', background: '#FFF', borderRight: '1px solid #EFF0F5' }}>
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Company header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '153px', border: '1.6px solid #EFF0F5', overflow: 'hidden', background: '#F9F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {ticker.logo_url ? (
                <img src={ticker.logo_url} alt={ticker.ticker} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#6E738C' }}>{ticker.ticker.slice(0, 2)}</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: '#2C2E35' }}>Add ${ticker.ticker} stock</span>
              <span style={{ fontSize: '14px', color: '#6E738C' }}>Add {ticker.company_name} Asset</span>
            </div>
          </div>

          {/* Lots form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {lots.map((lot, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {idx > 0 && (
                  <div className="flex items-center justify-between" style={{ paddingTop: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#6E738C' }}>Lot {idx + 1}</span>
                    <button type="button" onClick={() => removeLot(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                      <CloseIcon size={14} color="#B3B8CB" />
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35' }}>Quantity <span style={{ color: '#E53E3E' }}>*</span></label>
                  <input type="number" min="0" step="any" value={lot.quantity} onChange={(e) => updateLot(idx, 'quantity', e.target.value)} placeholder="0"
                    style={{ height: '40px', padding: '0 16px', background: '#F9F9FB', borderRadius: '12px', border: '1px solid #EFF0F5', fontSize: '14px', color: '#2C2E35', outline: 'none', width: '100%' }} />
                  <span style={{ fontSize: '12px', color: '#6E738C' }}>Number of shares you hold for this position</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35' }}>Acquisition Date <span style={{ color: '#E53E3E' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type="date" value={lot.date} onChange={(e) => updateLot(idx, 'date', e.target.value)}
                      style={{ height: '40px', padding: '0 40px 0 16px', background: '#F9F9FB', borderRadius: '12px', border: '1px solid #EFF0F5', fontSize: '14px', color: lot.date ? '#2C2E35' : '#B3B8CB', outline: 'none', width: '100%', colorScheme: 'light' }} />
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <CalendarIcon />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addLot}
              className="flex items-center justify-center gap-1.5 hover:opacity-80 transition-opacity"
              style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: '1px solid #E3E5ED', background: 'transparent', cursor: 'pointer', alignSelf: 'flex-start' }}>
              <PlusCircleIcon size={13} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#033AB8' }}>Add another lot</span>
            </button>
          </div>
          <YahooAttribution />
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', overflowY: 'auto', background: '#F9F9FB' }}>
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: '#2C2E35' }}>Stock preview</span>
          <div style={{ background: '#EFF0F5', borderRadius: '16px', overflow: 'hidden' }}>
            {[
              { label: 'Company', value: ticker.company_name },
              { label: 'Ticker', value: ticker.ticker },
              { label: 'Current Price', value: quote ? `${fmt(quote.price, quote.currency)} ${quote.currency}` : '—' },
              { label: 'Exchange', value: ticker.exchange || (quote?.exchange ?? '—') },
              { label: 'Return', value: quote ? `${changePositive ? '+' : ''}${changePct.toFixed(2)}%` : '—', valueColor: quote ? (changePositive ? '#008753' : '#C50F3C') : '#6E738C', valueBold: true },
            ].map((row, i, arr) => (
              <div key={row.label} className="flex items-center justify-between"
                style={{ height: '46px', padding: '0 16px', borderBottom: i < arr.length - 1 ? '1px solid #E3E5ED' : 'none' }}>
                <span style={{ fontSize: '13px', color: '#6E738C' }}>{row.label}</span>
                <span style={{ fontSize: '13px', fontWeight: row.valueBold ? 600 : 500, color: row.valueColor ?? '#2C2E35' }}>{row.value}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={onSubmit} disabled={!isFormValid || creating}
            className="transition-all"
            style={{ width: '100%', height: '32px', borderRadius: '10px', border: 'none', cursor: isFormValid && !creating ? 'pointer' : 'not-allowed', background: isFormValid && !creating ? 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)' : '#E3E5ED', color: isFormValid && !creating ? '#FFF' : '#B3B8CB', fontSize: '14px', fontWeight: 600 }}>
            {creating ? 'Adding...' : `Add $${ticker.ticker}`}
          </button>
          <YahooAttribution />
        </div>
      </div>
    </div>
  )
}

// ─── Add Asset Modal ──────────────────────────────────────────────────────────
type AddAssetStep = 'type-select' | 'stock-search' | 'stock-details' | 'stock-manual'

function AddAssetModal({
  portfolioId, folderId, onClose, onSuccess,
}: {
  portfolioId: string
  folderId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const qc = useQueryClient()
  const [step, setStep] = useState<AddAssetStep>('type-select')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedTicker, setSelectedTicker] = useState<TickerSearchResult | null>(null)
  const [lots, setLots] = useState<Lot[]>([{ quantity: '', date: '' }])
  const [manualForm, setManualForm] = useState<ManualStockForm>({
    name: '', ticker: '', price: '', currency: 'USD', lots: [{ quantity: '', date: '' }], imageUrl: null,
  })
  const [mutationError, setMutationError] = useState<string | null>(null)

  const { mutate: createAsset, isPending: creating } = useMutation({
    mutationFn: async () => {
      if (!portfolioId) throw new Error('Portfolio not loaded. Please try again.')
      if (!folderId) throw new Error('No folder selected. Please try again.')
      const isManual = step === 'stock-manual'
      await assetApi.create(portfolioId, isManual ? {
        folder_id: folderId,
        asset_type: 'stock_manual',
        name: manualForm.name.trim(),
        ticker: manualForm.ticker.trim() || undefined,
        current_price: parseFloat(manualForm.price),
        currency: manualForm.currency,
        image_url: manualForm.imageUrl ?? undefined,
        lots: manualForm.lots.map((l) => ({
          quantity: parseFloat(l.quantity),
          acquisition_date: l.date,
        })),
      } : {
        folder_id: folderId,
        asset_type: 'stock_ticker',
        ticker: selectedTicker!.ticker,
        lots: lots.map((l) => ({ quantity: parseFloat(l.quantity), acquisition_date: l.date })),
      })
    },
    onSuccess: () => {
      setMutationError(null)
      qc.invalidateQueries({ queryKey: ['assets', portfolioId] })
      qc.invalidateQueries({ queryKey: ['assets-overview', portfolioId] })
      qc.invalidateQueries({ queryKey: ['folders', portfolioId] })
      onSuccess()
      onClose()
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string }; message?: string } } })
          ?.response?.data?.error?.message ??
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as { message?: string })?.message ??
        'Something went wrong. Please try again.'
      setMutationError(msg)
    },
  })

  const progressPct = step === 'type-select' ? 0 : step === 'stock-search' ? 50 : 100
  const stepTitle =
    step === 'type-select' ? 'Choose an Asset Type' :
    step === 'stock-search' ? 'Search for a Stock' :
    step === 'stock-manual' ? 'Add Manually' :
    selectedTicker ? `Add $${selectedTicker.ticker} stock` : 'Add stock'
  const canContinue =
    step === 'type-select' ? selectedType === 'stock_ticker' :
    step === 'stock-search' ? selectedTicker !== null :
    false

  const handleBack = () => {
    if (step === 'type-select') onClose()
    else if (step === 'stock-search') setStep('type-select')
    else if (step === 'stock-manual') setStep('stock-search')
    else setStep('stock-search')
  }
  const handleContinue = () => {
    if (step === 'type-select' && selectedType === 'stock_ticker') setStep('stock-search')
    else if (step === 'stock-search' && selectedTicker) setStep('stock-details')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,3,0.6)' }} onClick={onClose} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 'min(904px, calc(100dvh - 24px))', background: '#FFF', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1) both' }}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ height: '54px', padding: '0 24px', borderBottom: '1px solid #EFF0F5', flexShrink: 0 }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#2C2E35' }}>{stepTitle}</span>
          <button type="button" onClick={onClose} className="flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: '#F9F9FB', cursor: 'pointer' }}>
            <CloseIcon size={14} />
          </button>
        </div>
        {/* Progress bar */}
        <div style={{ height: '2px', background: '#EFF0F5', flexShrink: 0 }}>
          <div style={{ height: '2px', background: '#033AB8', width: progressPct === 0 ? '10px' : `${progressPct}%`, transition: 'width 0.35s ease' }} />
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: step === 'stock-details' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>
          {step === 'type-select' && <TypeSelectStep selected={selectedType} onSelect={setSelectedType} />}
          {step === 'stock-search' && (
            <StockSearchStep portfolioId={portfolioId} selected={selectedTicker} onSelect={setSelectedTicker}
              onAddManually={() => setStep('stock-manual')} />
          )}
          {step === 'stock-manual' && (
            <ManualStockStep
              form={manualForm}
              onChange={(f) => { setMutationError(null); setManualForm(f) }}
              creating={creating}
              onSubmit={() => createAsset()}
              error={mutationError}
            />
          )}
          {step === 'stock-details' && selectedTicker && (
            <StockDetailsStep portfolioId={portfolioId} ticker={selectedTicker} lots={lots} onLotsChange={setLots} creating={creating} onSubmit={() => createAsset()} />
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between" style={{ height: '60px', padding: '0 24px', borderTop: '1px solid #EFF0F5', flexShrink: 0 }}>
          <button type="button" onClick={handleBack} className="hover:opacity-80 transition-opacity"
            style={{ height: '32px', padding: '0 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)', boxShadow: BTN_SHADOW, fontSize: '13px', fontWeight: 500, color: '#2C2E35', cursor: 'pointer' }}>
            Back
          </button>
          {step !== 'stock-details' && step !== 'stock-manual' && (
            <button type="button" onClick={handleContinue} disabled={!canContinue} className="transition-all"
              style={{ height: '32px', padding: '0 20px', borderRadius: '8px', border: 'none', background: canContinue ? 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)' : '#E3E5ED', fontSize: '13px', fontWeight: 600, color: canContinue ? '#FFF' : '#B3B8CB', cursor: canContinue ? 'pointer' : 'not-allowed' }}>
              Continue
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
    </div>
  )
}

// ─── Currency selector ────────────────────────────────────────────────────────
function CurrencySelector({ currentCode, portfolioId, onUpdated }: { currentCode: string; portfolioId: string; onUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data: currenciesData } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => currencyApi.list().then((r) => r.data.data ?? []),
    staleTime: Infinity,
  })
  const currencies = currenciesData ?? []
  const filtered = search.trim()
    ? currencies.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
    : currencies

  const { mutate: updateCurrency, isPending } = useMutation({
    mutationFn: (code: string) => portfolioApi.update(portfolioId, { base_currency: code }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolios'] }); qc.invalidateQueries({ queryKey: ['assets-overview', portfolioId] }); setOpen(false); setSearch(''); onUpdated() },
  })

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) { setOpen(false); setSearch('') } }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen((o) => !o)} disabled={isPending}
        className="flex items-center gap-1.5 hover:opacity-80 active:scale-[0.97] transition-[opacity,transform]"
        style={{ height: '28px', padding: '0 8px', borderRadius: '6px', background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)', boxShadow: BTN_SHADOW, border: 'none', cursor: isPending ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '12px', lineHeight: 1 }}>{currencyFlag(currentCode)}</span>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#2C2E35' }}>{currentCode}</span>
        <ChevronDownIcon />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: '260px', background: '#FFF', boxShadow: DROPDOWN_SHADOW, borderRadius: '10px', zIndex: 200, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 8px 4px' }}>
            <div className="flex items-center gap-1.5" style={{ height: '28px', padding: '0 8px', background: '#EFF0F5', borderRadius: '6px' }}>
              <SearchIcon />
              <input type="text" autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search currency…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', color: '#2C2E35' }} />
            </div>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '220px', padding: '2px 4px 4px' }}>
            {filtered.map((c) => (
              <button key={c.code} type="button" onClick={() => updateCurrency(c.code)} disabled={c.code === currentCode || isPending}
                className="flex items-center gap-2 w-full hover:bg-[#F9F9FB] transition-colors"
                style={{ padding: '5px 8px', height: '32px', borderRadius: '6px', border: 'none', background: c.code === currentCode ? '#EFF0F5' : 'transparent', cursor: c.code === currentCode ? 'default' : 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: '13px', lineHeight: 1 }}>{currencyFlag(c.code)}</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#2C2E35', minWidth: '36px' }}>{c.code}</span>
                <span style={{ fontSize: '11px', color: '#6E738C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="flex items-center justify-center" style={{ height: '40px', fontSize: '12px', color: '#B3B8CB' }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Performance badge ────────────────────────────────────────────────────────
function PerformanceBadge({ pct }: { pct: number | null | undefined }) {
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

// ─── Folder icon ──────────────────────────────────────────────────────────────
function FolderTabIcon({ color }: { color: string }) {
  return (
    <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="11" height="10" viewBox="0 0 11 10" fill="none">
        <path d="M.5 2a1 1 0 0 1 1-1H4l1 1h4.5a1 1 0 0 1 1 1V8a1 1 0 0 1-1 1H1.5A1 1 0 0 1 .5 8V2Z" fill="white" opacity="0.9" />
      </svg>
    </div>
  )
}

// ─── Folder tab context menu ──────────────────────────────────────────────────
function FolderTabMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (open) { setOpen(false); return }
    const rect = btnRef.current!.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left })
    setOpen(true)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="flex items-center justify-center transition-opacity"
        style={{
          width: '18px', height: '18px', borderRadius: '4px', border: 'none',
          background: 'transparent', cursor: 'pointer', padding: 0,
          color: open ? '#6E738C' : '#C8CCDA', flexShrink: 0,
        }}
      >
        <DotsIcon />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, zIndex: 1000,
            width: '139px', background: '#FFFFFF', borderRadius: '10px',
            padding: '2px', display: 'flex', flexDirection: 'column', gap: '2px',
            boxShadow: DROPDOWN_SHADOW,
          }}
        >
          {[
            { label: 'Edit', color: '#2C2E35', hover: '#F9F9FB', action: onEdit },
            { label: 'Delete', color: '#F03722', hover: '#FFF5F5', action: onDelete },
          ].map(({ label, color, hover, action }) => (
            <button
              key={label}
              type="button"
              onClick={() => { action(); setOpen(false) }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              style={{
                display: 'flex', alignItems: 'center', padding: '8px 10px',
                borderRadius: '8px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontSize: '13px', color, width: '100%', textAlign: 'left',
              }}
            >
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

// ─── Folder tabs ──────────────────────────────────────────────────────────────
function FolderTabs({
  folders, selectedId, onSelect, portfolioId, onFolderCreated, showCards, onToggleCards,
}: {
  folders: Folder[]
  selectedId: string | null
  onSelect: (id: string) => void
  portfolioId: string
  onFolderCreated: (id: string) => void
  showCards: boolean
  onToggleCards: () => void
}) {
  const qc = useQueryClient()

  // ── new folder ──────────────────────────────────────────────────────────
  const [showInput, setShowInput] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (showInput) inputRef.current?.focus() }, [showInput])

  // ── drag & drop ─────────────────────────────────────────────────────────
  const [localFolders, setLocalFolders] = useState<Folder[]>(folders)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const dragOverId = useRef<string | null>(null)
  useEffect(() => { if (!draggedId) setLocalFolders(folders) }, [folders, draggedId])

  // ── inline rename ───────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // ── mutations ───────────────────────────────────────────────────────────
  const { mutate: createFolder, isPending: creating } = useMutation({
    mutationFn: (name: string) => folderApi.create(portfolioId, { name, folder_type: 'asset' }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['folders', portfolioId] })
      setShowInput(false); setInputValue('')
      onFolderCreated(res.data.data.id)
    },
  })

  const { mutate: reorderFolders } = useMutation({
    mutationFn: (ordered: Folder[]) =>
      folderApi.reorder(portfolioId, ordered.map((f, i) => ({ id: f.id, position: i }))),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders', portfolioId] }),
    onError: () => setLocalFolders(folders),
  })

  const { mutate: renameFolder } = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      folderApi.update(portfolioId, id, { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['folders', portfolioId] }); setEditingId(null) },
  })

  const { mutate: deleteFolder } = useMutation({
    mutationFn: (id: string) => folderApi.remove(portfolioId, id),
    onSuccess: (_, deletedId) => {
      qc.invalidateQueries({ queryKey: ['folders', portfolioId] })
      if (deletedId === selectedId) {
        const remaining = localFolders.filter(f => f.id !== deletedId)
        if (remaining.length) onSelect(remaining[0].id)
      }
    },
  })

  // ── drag handlers ───────────────────────────────────────────────────────
  const handleDragStart = (id: string) => { setDraggedId(id); dragOverId.current = id }

  const handleDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault()
    if (overId === draggedId || overId === dragOverId.current) return
    dragOverId.current = overId
    setLocalFolders(prev => {
      const from = prev.findIndex(f => f.id === draggedId)
      const to = prev.findIndex(f => f.id === overId)
      if (from === -1 || to === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  const handleDrop = () => {
    if (draggedId) reorderFolders(localFolders)
    setDraggedId(null); dragOverId.current = null
  }

  const handleDragEnd = () => { setDraggedId(null); dragOverId.current = null }

  const handleCreate = () => {
    const name = inputValue.trim()
    if (!name) { setShowInput(false); setInputValue(''); return }
    createFolder(name)
  }

  const commitRename = (id: string) => {
    const name = editValue.trim()
    if (name) renameFolder({ id, name })
    else setEditingId(null)
  }

  return (
    <div style={{ borderBottom: '1px solid #EFF0F5', padding: '0 40px', display: 'flex', alignItems: 'flex-end', overflowX: 'auto', flexShrink: 0, position: 'relative' }}>
      {localFolders.map((folder, i) => {
        const isActive = folder.id === selectedId
        const color = FOLDER_TAB_COLORS[i % FOLDER_TAB_COLORS.length]
        const isDragging = folder.id === draggedId

        if (editingId === folder.id) {
          return (
            <div key={folder.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', marginBottom: '-1px', borderBottom: '2px solid #033AB8' }}>
              <FolderTabIcon color={color} />
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(folder.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                onBlur={() => commitRename(folder.id)}
                style={{ height: '24px', padding: '0 8px', borderRadius: '5px', border: '1px solid #033AB8', fontSize: '13px', color: '#2C2E35', background: '#FFF', outline: 'none', width: '110px' }}
              />
            </div>
          )
        }

        return (
          <div
            key={folder.id}
            draggable
            onDragStart={() => handleDragStart(folder.id)}
            onDragOver={(e) => handleDragOver(e, folder.id)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            style={{
              display: 'flex', alignItems: 'center',
              borderBottom: isActive ? '2px solid #033AB8' : '2px solid transparent',
              marginBottom: '-1px',
              opacity: isDragging ? 0.35 : 1,
              transition: 'opacity 0.12s',
              cursor: 'grab',
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(folder.id)}
              style={{
                padding: '10px 6px 10px 14px', border: 'none', background: 'transparent',
                cursor: 'pointer', color: isActive ? '#2C2E35' : '#6E738C',
                fontSize: '13px', fontWeight: isActive ? 600 : 500,
                whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <FolderTabIcon color={color} />
              <span>{folder.name}</span>
            </button>

            <div style={{ paddingRight: '10px', display: 'flex', alignItems: 'center' }}>
              <FolderTabMenu
                onEdit={() => { setEditingId(folder.id); setEditValue(folder.name) }}
                onDelete={() => deleteFolder(folder.id)}
              />
            </div>
          </div>
        )
      })}

      {showInput && (
        <div className="flex items-center gap-2" style={{ padding: '6px 8px', marginBottom: '4px' }}>
          <input ref={inputRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowInput(false); setInputValue('') } }}
            placeholder="Folder name" disabled={creating}
            style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: '1px solid #033AB8', fontSize: '13px', color: '#2C2E35', background: '#FFF', outline: 'none', width: '140px' }} />
          <button type="button" onClick={handleCreate} disabled={creating}
            style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: 'none', background: '#033AB8', color: '#FFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            {creating ? '…' : 'Create'}
          </button>
          <button type="button" onClick={() => { setShowInput(false); setInputValue('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}>
            <CloseIcon size={14} />
          </button>
        </div>
      )}

      {!showInput && (
        <button type="button" onClick={() => setShowInput(true)}
          className="flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ width: '32px', height: '32px', marginBottom: '4px', marginLeft: '4px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="#B3B8CB" strokeWidth="1.2" />
            <path d="M8 5v6M5 8h6" stroke="#B3B8CB" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Eye toggle — pushed to far right */}
      <button
        type="button"
        onClick={onToggleCards}
        title={showCards ? 'Hide stats' : 'Show stats'}
        style={{ marginLeft: 'auto', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#B3B8CB', padding: '2px 4px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, flexShrink: 0, transition: 'color 0.15s' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#6E738C')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#B3B8CB')}
      >
        {showCards ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
        <span>{showCards ? 'Hide' : 'Show'}</span>
      </button>
    </div>
  )
}

// ─── Assets overview (two stat cards) ────────────────────────────────────────
function AssetsOverview({
  assets, currency, loading, showCards,
}: {
  assets: AssetItem[]
  currency: string
  loading: boolean
  showCards: boolean
}) {
  const investable = assets.filter((a) => a.investability === 'investable')
  const nonInvestable = assets.filter((a) => a.investability !== 'investable')
  const totalValue = assets.reduce((s, a) => s + (a.owned_value_converted ?? 0), 0)
  const investableValue = investable.reduce((s, a) => s + (a.owned_value_converted ?? 0), 0)
  const nonInvestableValue = nonInvestable.reduce((s, a) => s + (a.owned_value_converted ?? 0), 0)

  const StatCard = ({ title, main, investableLabel, nonInvestableLabel }: { title: string; main: React.ReactNode; investableLabel: string; nonInvestableLabel: string }) => (
    <div style={{ flex: 1, background: '#FFF', boxShadow: PANEL_SHADOW, borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 12px' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2.5px solid #033AB8', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#6E738C', fontWeight: 500 }}>{title}</span>
        </div>
        {loading ? (
          <div style={{ height: '36px', width: '160px', background: '#EFF0F5', borderRadius: '6px' }} />
        ) : (
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px', color: '#2C2E35' }}>{main}</span>
        )}
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid #EFF0F5' }}>
        <div style={{ flex: 1, padding: '12px 16px 0', borderRight: '1px solid #EFF0F5' }}>
          <div style={{ fontSize: '11px', color: '#6E738C', marginBottom: '6px' }}>Investable Assets</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#2C2E35', marginBottom: '12px' }}>{investableLabel}</div>
          <div style={{ height: '2px', background: '#033AB8' }} />
        </div>
        <div style={{ flex: 1, padding: '12px 16px 0' }}>
          <div style={{ fontSize: '11px', color: '#6E738C', marginBottom: '6px' }}>Non-Investable Assets</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#2C2E35', marginBottom: '12px' }}>{nonInvestableLabel}</div>
          <div style={{ height: '2px', borderBottom: '2px dashed #033AB8' }} />
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '20px 40px 0' }}>
      {showCards && (
        <div style={{ display: 'flex', gap: '16px' }}>
          <StatCard
            title="Investment Value"
            main={fmt(totalValue, currency)}
            investableLabel={fmt(investableValue, currency)}
            nonInvestableLabel={fmt(nonInvestableValue, currency)}
          />
          <StatCard
            title="Total Assets"
            main={String(assets.length)}
            investableLabel={String(investable.length)}
            nonInvestableLabel={String(nonInvestable.length)}
          />
        </div>
      )}
    </div>
  )
}

// ─── Asset table ──────────────────────────────────────────────────────────────
function AssetTable({
  assets, loading, onAddAsset, onOpenPanel,
}: {
  assets: AssetItem[]
  loading: boolean
  onAddAsset: () => void
  onOpenPanel: (asset: AssetItem) => void
}) {
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [investabilityFilter, setInvestabilityFilter] = useState<string | null>(null)
  const [tableSearch, setTableSearch] = useState('')
  const [typeOpen, setTypeOpen] = useState(false)
  const [investOpen, setInvestOpen] = useState(false)
  const typeRef = useRef<HTMLDivElement>(null)
  const investRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!typeRef.current?.contains(e.target as Node)) setTypeOpen(false)
      if (!investRef.current?.contains(e.target as Node)) setInvestOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Filter
  let display = assets
  if (typeFilter) display = display.filter((a) => a.asset_type === typeFilter)
  if (investabilityFilter) display = display.filter((a) =>
    investabilityFilter === 'investable' ? a.investability === 'investable' : a.investability !== 'investable',
  )
  if (tableSearch.trim()) {
    const q = tableSearch.toLowerCase()
    display = display.filter((a) => a.name.toLowerCase().includes(q) || (a.ticker ?? '').toLowerCase().includes(q))
  }

  const presentTypes = [...new Set(assets.map((a) => a.asset_type))]

  const FilterBtn = ({ label, value, options, open, onOpen, onSelect }: {
    label: string; value: string | null; options: { label: string; value: string | null }[]
    open: boolean; onOpen: () => void; onSelect: (v: string | null) => void
  }) => (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={onOpen}
        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
        style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: value ? '1px solid #033AB8' : 'none', background: value ? '#F0F4FF' : 'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)', boxShadow: value ? 'none' : BTN_SHADOW, fontSize: '12px', fontWeight: 500, color: value ? '#033AB8' : '#2C2E35', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {value ? options.find((o) => o.value === value)?.label ?? label : label}
        <ChevronDownIcon size={10} color={value ? '#033AB8' : '#6E738C'} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: '#FFF', boxShadow: DROPDOWN_SHADOW, borderRadius: '10px', zIndex: 50, padding: '4px', minWidth: '160px' }}>
          {options.map((opt) => (
            <button key={String(opt.value)} type="button"
              onClick={() => { onSelect(opt.value); onOpen() }}
              style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '6px 10px', borderRadius: '6px', border: 'none', background: value === opt.value ? '#EFF0F5' : 'transparent', fontSize: '13px', color: '#2C2E35', cursor: 'pointer', textAlign: 'left' }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ flex: 1, margin: '0 40px 40px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Filter bar */}
      <div className="flex items-center justify-between" style={{ padding: '16px 0', gap: '8px', flexShrink: 0 }}>
        <div className="flex items-center gap-2">
          <div ref={typeRef}>
            <FilterBtn
              label="Asset Type" value={typeFilter}
              options={[{ label: 'All Types', value: null }, ...presentTypes.map((t) => ({ label: ASSET_TYPE_LABELS[t] ?? t, value: t }))]}
              open={typeOpen} onOpen={() => { setTypeOpen((o) => !o); setInvestOpen(false) }} onSelect={setTypeFilter}
            />
          </div>
          <div ref={investRef}>
            <FilterBtn
              label="Investability" value={investabilityFilter}
              options={[{ label: 'All', value: null }, { label: 'Investable', value: 'investable' }, { label: 'Non-Investable', value: 'non_investable' }]}
              open={investOpen} onOpen={() => { setInvestOpen((o) => !o); setTypeOpen(false) }} onSelect={setInvestabilityFilter}
            />
          </div>
        </div>
        {/* Search */}
        <div className="flex items-center gap-2" style={{ height: '32px', padding: '0 12px', background: '#F9F9FB', borderRadius: '8px', border: '1px solid #EFF0F5', width: '240px' }}>
          <SearchIcon size={14} />
          <input type="text" value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} placeholder="Search..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#2C2E35' }} />
          {tableSearch && (
            <button type="button" onClick={() => setTableSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <CloseIcon size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, background: '#FFF', boxShadow: PANEL_SHADOW, borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Table header */}
        <div className="flex items-center" style={{ height: '40px', padding: '0 16px', borderBottom: '1px solid #EFF0F5', flexShrink: 0, gap: '0' }}>
          <div style={{ width: '28px', flexShrink: 0 }}>
            <input type="checkbox" style={{ cursor: 'pointer' }} />
          </div>
          {[
            { label: 'Asset', flex: 1, align: 'left' },
            { label: 'Type', width: '140px', align: 'left' },
            { label: '1M', width: '100px', align: 'left' },
            { label: 'Value', width: '160px', align: 'right' },
          ].map((col) => (
            <div key={col.label} className="flex items-center gap-1" style={{ flex: col.flex, width: col.width, flexShrink: col.flex ? undefined : 0, justifyContent: col.align === 'right' ? 'flex-end' : undefined }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#6E738C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{col.label}</span>
              <SortIcon />
            </div>
          ))}
          <div style={{ width: '32px', flexShrink: 0 }} />
        </div>

        {/* Rows / states */}
        {loading ? (
          <div className="flex items-center justify-center" style={{ flex: 1, minHeight: '160px' }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid #EFF0F5', borderTopColor: '#033AB8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : display.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4" style={{ flex: 1, padding: '48px 40px', animation: 'fadeInUp 0.4s ease both' }}>
            <div className="flex items-center justify-center" style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF0F5' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M3 6a2 2 0 0 1 2-2h4.586L11 5.414A2 2 0 0 0 12.414 6H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" fill="#033AB8" opacity="0.25" />
                <path d="M12 9v6M9 12h6" stroke="#033AB8" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#2C2E35', margin: '0 0 4px' }}>No assets found</p>
              <p style={{ fontSize: '13px', color: '#6E738C', margin: 0 }}>
                {assets.length === 0 ? 'Add your first asset to get started' : 'Try adjusting your filters'}
              </p>
            </div>
            {assets.length === 0 && (
              <button type="button" onClick={onAddAsset}
                className="flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-[opacity,transform]"
                style={{ height: '32px', padding: '0 16px', borderRadius: '8px', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', color: '#FFF', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                Create Asset
              </button>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {display.map((asset, i) => (
              <div key={asset.id} className="flex items-center group"
                style={{ height: '60px', padding: '0 16px', borderBottom: i < display.length - 1 ? '1px solid #EFF0F5' : 'none', gap: '0' }}>
                {/* Checkbox */}
                <div style={{ width: '28px', flexShrink: 0 }}>
                  <input type="checkbox" style={{ cursor: 'pointer' }} />
                </div>
                {/* Asset */}
                <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #EFF0F5', background: '#F9F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {asset.logo_url ? (
                      <img src={asset.logo_url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : asset.icon ? (
                      <span dangerouslySetInnerHTML={{ __html: asset.icon }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px' }} />
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#6E738C' }}>{(asset.ticker || asset.name).slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#2C2E35', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</span>
                    {asset.ticker && <span style={{ fontSize: '11px', color: '#B3B8CB' }}>{asset.ticker}</span>}
                  </div>
                </div>
                {/* Type */}
                <div style={{ width: '140px', flexShrink: 0 }}>
                  <span style={{ fontSize: '13px', color: '#6E738C' }}>{ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}</span>
                </div>
                {/* 1M performance */}
                <div style={{ width: '100px', flexShrink: 0 }}>
                  <PerformanceBadge pct={asset.change_pct} />
                </div>
                {/* Value */}
                <div style={{ width: '160px', flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C2E35' }}>{fmt(asset.owned_value_converted, asset.converted_currency)}</div>
                  {asset.total_quantity != null && asset.ticker && (
                    <div style={{ fontSize: '11px', color: '#B3B8CB' }}>{asset.total_quantity.toLocaleString()} {asset.ticker}</div>
                  )}
                </div>
                {/* Actions */}
                <div style={{ width: '32px', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => onOpenPanel(asset)}
                    className="flex items-center justify-center hover:opacity-70 transition-opacity"
                    style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                    <DotsIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Asset side panel ─────────────────────────────────────────────────────────
type PanelTab = 'history' | 'autopilot' | 'reporting' | 'note' | 'documents'

const FREQ_LABELS: Record<string, string> = {
  daily: 'Daily', weekly: 'Weekly', biweekly: 'Biweekly',
  monthly: 'Monthly', quarterly: 'Quarterly', biannual: 'Biannual', annually: 'Annually',
}

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDateRange(start: string, end?: string | null): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
  return end ? `${fmt(start)} – ${fmt(end)}` : `${fmt(start)} – ongoing`
}
function fmtFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

// ─── Add Rule modal ───────────────────────────────────────────────────────────
type AmountType = 'amount' | 'units'
interface RuleFormState {
  action: 'add' | 'remove'
  amountType: AmountType
  value: string
  frequency: string
  startDate: string
  endDate: string
}
const EMPTY_RULE_FORM: RuleFormState = {
  action: 'add', amountType: 'units', value: '', frequency: 'weekly', startDate: '', endDate: '',
}

function AddRuleModal({
  asset, portfolioId, onClose, onSaved,
}: {
  asset: AssetItem
  portfolioId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<RuleFormState>(EMPTY_RULE_FORM)
  const [error, setError] = useState<string | null>(null)

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => {
      const val = parseFloat(form.value)
      if (isNaN(val) || val <= 0) throw new Error('Enter a valid amount')
      if (!form.startDate) throw new Error('Start date is required')
      return autopilotApi.createRule(portfolioId, {
        target_id: asset.id,
        target_type: 'asset',
        action: form.action,
        ...(form.amountType === 'units' ? { units: val } : { amount: val }),
        frequency: form.frequency,
        start_date: new Date(form.startDate).toISOString(),
        ...(form.endDate ? { end_date: new Date(form.endDate).toISOString() } : {}),
      })
    },
    onSuccess: () => { onSaved(); onClose() },
    onError: (e: unknown) => setError((e as Error).message ?? 'Failed to save rule'),
  })

  const inputStyle: React.CSSProperties = {
    height: '40px', padding: '0 14px', background: '#F9F9FB', border: 'none',
    borderRadius: '10px', fontSize: '13px', color: '#2C2E35', outline: 'none', width: '100%',
    fontFamily: 'var(--font-sans)',
  }

  const field = (label: string, required: boolean, children: React.ReactNode) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#2C2E35' }}>{label}</label>
        {required && <span style={{ color: '#F03722', fontSize: '13px' }}>*</span>}
      </div>
      {children}
    </div>
  )

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,3,0.5)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '440px', background: '#FFF', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', animation: 'fadeInUp 0.2s cubic-bezier(0.16,1,0.3,1) both' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#2C2E35', letterSpacing: '-0.2px' }}>Add Auto-Pilot Rule</span>
          <button type="button" onClick={onClose}
            style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: '#F9F9FB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1l9 9M10 1L1 10" stroke="#6E738C" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Action toggle */}
        {field('Action', true,
          <div style={{ display: 'flex', background: '#F9F9FB', borderRadius: '10px', padding: '3px', gap: '2px' }}>
            {(['add', 'remove'] as const).map(a => (
              <button key={a} type="button" onClick={() => setForm(f => ({ ...f, action: a }))}
                style={{ flex: 1, height: '34px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.12s',
                  background: form.action === a ? '#FFF' : 'transparent',
                  color: form.action === a ? (a === 'add' ? '#008753' : '#F03722') : '#6E738C',
                  boxShadow: form.action === a ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>
                {a === 'add' ? '+ Add' : '− Remove'}
              </button>
            ))}
          </div>
        )}

        {/* Amount */}
        {field('Amount', true,
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="number" min="0" step="any" value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              placeholder={form.amountType === 'units' ? 'e.g. 10' : 'e.g. 500'}
              style={{ ...inputStyle, flex: 1 }} />
            <button type="button"
              onClick={() => setForm(f => ({ ...f, amountType: f.amountType === 'units' ? 'amount' : 'units' }))}
              style={{ height: '40px', padding: '0 12px', borderRadius: '10px', border: 'none', background: '#EFF0F5', color: '#2C2E35', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {form.amountType === 'units' && asset.ticker ? `${asset.ticker}` : '$'}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5l3-3" stroke="#6E738C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}

        {/* Frequency */}
        {field('Frequency', true,
          <div style={{ position: 'relative' }}>
            <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
              style={{ ...inputStyle, appearance: 'none', paddingRight: '36px', cursor: 'pointer' }}>
              {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="#6E738C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        )}

        {/* Start / End dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {field('Start Date', true,
            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              style={{ ...inputStyle }} />
          )}
          {field('End Date', false,
            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              style={{ ...inputStyle }} />
          )}
        </div>

        {error && <div style={{ fontSize: '12px', color: '#F03722', background: '#FFF0EE', borderRadius: '8px', padding: '8px 12px' }}>{error}</div>}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => { setForm(EMPTY_RULE_FORM); setError(null) }}
            style={{ height: '38px', padding: '0 18px', borderRadius: '10px', border: '1px solid #EFF0F5', background: '#FFF', color: '#6E738C', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Clear
          </button>
          <button type="button" onClick={() => save()} disabled={isPending}
            style={{ height: '38px', padding: '0 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: isPending ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {isPending ? 'Saving…' : 'Save Rule'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Pause rule dialog ────────────────────────────────────────────────────────
function PauseRuleDialog({
  rule, portfolioId, onClose, onPaused,
}: {
  rule: AutopilotRule
  portfolioId: string
  onClose: () => void
  onPaused: () => void
}) {
  const { mutate: pause, isPending } = useMutation({
    mutationFn: () => autopilotApi.pauseRule(portfolioId, rule.id),
    onSuccess: () => { onPaused(); onClose() },
  })
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,3,0.45)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '380px', background: '#FFF', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.16)', animation: 'fadeInUp 0.18s cubic-bezier(0.16,1,0.3,1) both' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#2C2E35' }}>Pause Rule</div>
        <div style={{ fontSize: '13px', color: '#6E738C', lineHeight: '1.6' }}>
          This will pause this rule. The rule will not execute until you resume it.
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose}
            style={{ height: '36px', padding: '0 16px', borderRadius: '9px', border: '1px solid #EFF0F5', background: '#FFF', color: '#6E738C', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Close
          </button>
          <button type="button" onClick={() => pause()} disabled={isPending}
            style={{ height: '36px', padding: '0 18px', borderRadius: '9px', border: 'none', background: '#2C2E35', color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: isPending ? 0.7 : 1 }}>
            {isPending ? 'Pausing…' : 'Pause Rule'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Rule row context menu ────────────────────────────────────────────────────
function RuleMenu({
  rule, portfolioId, onEdit, onPause, onResume, onDelete,
}: {
  rule: AutopilotRule
  portfolioId: string
  onEdit: () => void
  onPause: () => void
  onResume: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const handleOpen = () => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 4, left: r.right - 148 })
    setOpen(v => !v)
  }

  const { mutate: deleteRule } = useMutation({
    mutationFn: () => autopilotApi.deleteRule(portfolioId, rule.id),
    onSuccess: onDelete,
  })

  const { mutate: resumeRule } = useMutation({
    mutationFn: () => autopilotApi.resumeRule(portfolioId, rule.id),
    onSuccess: onResume,
  })

  const item = (label: string, icon: React.ReactNode, color: string, onClick: () => void) => (
    <button type="button" onClick={() => { setOpen(false); onClick() }}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color, textAlign: 'left' }}>
      {icon}{label}
    </button>
  )

  return (
    <>
      <button ref={btnRef} type="button" onClick={handleOpen}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', color: '#B3B8CB', borderRadius: '4px' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="3" cy="7" r="1.1" fill="currentColor"/><circle cx="7" cy="7" r="1.1" fill="currentColor"/><circle cx="11" cy="7" r="1.1" fill="currentColor"/>
        </svg>
      </button>
      {open && createPortal(
        <div ref={menuRef} style={{ position: 'fixed', top: pos.top, left: pos.left, width: '148px', background: '#FFF', boxShadow: DROPDOWN_SHADOW, borderRadius: '10px', zIndex: 400, padding: '4px', overflow: 'hidden' }}>
          {rule.is_active
            ? item('Pause Rule',
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2.5" y="2" width="3" height="8" rx="0.8" fill="currentColor"/><rect x="6.5" y="2" width="3" height="8" rx="0.8" fill="currentColor"/></svg>,
                '#2C2E35', onPause)
            : item('Resume Rule',
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 2l7 4-7 4V2z" fill="currentColor"/></svg>,
                '#008753', resumeRule)
          }
          {item('Edit Rule',
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2-7 7-2.5.5.5-2.5 7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
            '#2C2E35', onEdit)}
          {item('Delete Rule',
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4 3V2h4v1M5 5.5v3M7 5.5v3M3 3l.5 7h5l.5-7H3z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
            '#F03722', () => deleteRule())}
        </div>,
        document.body,
      )}
    </>
  )
}

const FOLDER_COLORS = [
  ['#044FFA', '#033AB8'],
  ['#843CFF', '#5D04F6'],
  ['#BBE03B', '#5C7813'],
  ['#F03722', '#C91F0C'],
  ['#00B17A', '#007A54'],
  ['#F5A623', '#C07D12'],
]

function FolderIcon({ color1, color2, size = 40 }: { color1: string; color2: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M2 12a3 3 0 013-3h10.5l3 3H35a3 3 0 013 3v16a3 3 0 01-3 3H5a3 3 0 01-3-3V12z" fill={`url(#fc-${color1.replace('#','')})`}/>
      <defs>
        <linearGradient id={`fc-${color1.replace('#','')}`} x1="20" y1="9" x2="20" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor={color1}/>
          <stop offset="1" stopColor={color2}/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function MoveFolderModalContent({
  asset, folders, allAssets, isPending, onMove, onClose,
}: {
  asset: AssetItem
  folders: Folder[]
  allAssets: AssetItem[]
  isPending: boolean
  onMove: (folderId: string) => void
  onClose: () => void
}) {
  const [selectedFolderId, setSelectedFolderId] = useState(asset.folder_id)

  const assetCountByFolder = allAssets.reduce<Record<string, number>>((acc, a) => {
    acc[a.folder_id] = (acc[a.folder_id] ?? 0) + 1
    return acc
  }, {})

  const canMove = selectedFolderId !== asset.folder_id

  return (
    <>
      {/* Header */}
      <div style={{ height: '54px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EFF0F5', flexShrink: 0 }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Move to Folder</span>
        <button type="button" onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="#6E738C" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>
      {/* Body */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
        {folders.map((folder, idx) => {
          const [c1, c2] = FOLDER_COLORS[idx % FOLDER_COLORS.length]
          const count = assetCountByFolder[folder.id] ?? 0
          const isSelected = selectedFolderId === folder.id
          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => setSelectedFolderId(folder.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: '12px', border: `1px solid ${isSelected ? '#033AB8' : '#EFF0F5'}`,
                background: '#FFFFFF', cursor: 'pointer', textAlign: 'left', width: '100%',
                boxShadow: isSelected ? '0px 0px 0px 2px #ECF7FF' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                <FolderIcon color1={c1} color2={c2} size={40} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px', lineHeight: '22px' }}>{folder.name}</span>
                  <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px' }}>{count} {count === 1 ? 'asset' : 'assets'}</span>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: isSelected ? 1 : 0, flexShrink: 0 }}>
                <path d="M2 8l4.5 4.5L14 3.5" stroke="#033AB8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )
        })}
      </div>
      {/* Footer */}
      <div style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #EFF0F5', flexShrink: 0 }}>
        <button type="button" onClick={onClose}
          style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)', boxShadow: '0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.1)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#2C2E35' }}>
          Cancel
        </button>
        <button type="button" onClick={() => onMove(selectedFolderId)} disabled={!canMove || isPending}
          style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: 'none', background: canMove ? 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)' : '#E3E5ED', cursor: canMove && !isPending ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 600, color: canMove ? '#FFFFFF' : '#B3B8CB', transition: 'background 0.15s' }}>
          {isPending ? 'Moving…' : 'Move to Folder'}
        </button>
      </div>
    </>
  )
}

function AssetSidePanel({
  asset, portfolioId, folders, allAssets, onClose,
}: {
  asset: AssetItem
  portfolioId: string
  folders?: Folder[]
  allAssets?: AssetItem[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [tab, setTab] = useState<PanelTab>('history')
  const [showAddRule, setShowAddRule] = useState(false)
  const [pausingRule, setPausingRule] = useState<AutopilotRule | null>(null)
  const docFileRef = useRef<HTMLInputElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  // Panel action states
  const [showPanelMenu, setShowPanelMenu] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Note modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<AssetNote | null>(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteTags, setNoteTags] = useState('')

  // Reporting tab state
  const [reportInvestability, setReportInvestability] = useState(asset.investability)
  const [reportOwnershipPct, setReportOwnershipPct] = useState(String(asset.ownership_pct))
  const [reportSaved, setReportSaved] = useState(false)

  const folderName = folders?.find(f => f.id === asset.folder_id)?.name

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: lots } = useQuery({
    queryKey: ['asset-lots', asset.id],
    queryFn: () => assetApi.listLots(portfolioId, asset.id).then(r => r.data.data ?? []),
    staleTime: 60_000,
  })

  const { data: allRules } = useQuery({
    queryKey: ['autopilot-rules', portfolioId],
    queryFn: () => autopilotApi.listRules(portfolioId).then(r => r.data.data ?? []),
    staleTime: 30_000,
  })
  const rules = (allRules ?? []).filter(r => r.target_id === asset.id)

  const { data: notes } = useQuery({
    queryKey: ['asset-notes', asset.id],
    queryFn: () => assetApi.listNotes(portfolioId, asset.id).then(r => r.data.data ?? []),
    enabled: tab === 'note',
    staleTime: 30_000,
  })

  const { data: documents } = useQuery({
    queryKey: ['asset-docs', asset.id],
    queryFn: () => assetApi.listDocuments(portfolioId, asset.id).then(r => r.data.data ?? []),
    enabled: tab === 'documents',
    staleTime: 30_000,
  })

  // ── Mutations ──────────────────────────────────────────────────────────────
  const parsedTags = noteTags.split(',').map(t => t.trim()).filter(Boolean)

  const { mutate: saveNote, isPending: savingNote } = useMutation({
    mutationFn: () => editingNote
      ? assetApi.updateNote(portfolioId, asset.id, editingNote.id, { title: noteTitle, content: noteContent, tags: parsedTags })
      : assetApi.addNote(portfolioId, asset.id, { title: noteTitle, content: noteContent, tags: parsedTags }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-notes', asset.id] })
      setNoteModalOpen(false); setEditingNote(null); setNoteTitle(''); setNoteContent(''); setNoteTags('')
    },
  })

  const { mutate: deleteNote } = useMutation({
    mutationFn: (id: string) => assetApi.deleteNote(portfolioId, asset.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asset-notes', asset.id] }),
  })

  const { mutate: uploadDoc, isPending: uploadingDoc } = useMutation({
    mutationFn: (file: File) => assetApi.uploadDocument(portfolioId, asset.id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asset-docs', asset.id] }),
  })

  const { mutate: deleteDoc } = useMutation({
    mutationFn: (id: string) => assetApi.deleteDocument(portfolioId, asset.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['asset-docs', asset.id] }),
  })

  const { mutate: updateAsset, isPending: savingAsset } = useMutation({
    mutationFn: () => assetApi.update(portfolioId, asset.id, {
      ownership_pct: parseFloat(reportOwnershipPct),
      ...(asset.investability_editable ? { investability: reportInvestability } : {}),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets', portfolioId] })
      setReportSaved(true)
      setTimeout(() => setReportSaved(false), 2000)
    },
  })

  const { mutate: deleteAsset, isPending: deletingAsset } = useMutation({
    mutationFn: () => assetApi.delete(portfolioId, asset.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets', portfolioId] })
      qc.invalidateQueries({ queryKey: ['asset-overview', portfolioId] })
      onClose()
    },
  })

  const { mutate: moveAsset, isPending: movingAsset } = useMutation({
    mutationFn: (folderId: string) => assetApi.update(portfolioId, asset.id, { folder_id: folderId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets', portfolioId] })
      setShowMoveModal(false)
    },
  })

  const handleDownload = async (doc: AssetDocument) => {
    const res = await assetApi.documentDownloadUrl(portfolioId, asset.id, doc.id)
    window.open(res.data.data.url, '_blank')
  }

  const openCompose = (note?: AssetNote) => {
    if (note) {
      setEditingNote(note)
      setNoteTitle(note.title)
      setNoteContent(note.content)
      setNoteTags((note.tags?.items ?? []).join(', '))
    } else {
      setEditingNote(null); setNoteTitle(''); setNoteContent(''); setNoteTags('')
    }
    setNoteModalOpen(true)
  }


  const TABS: { id: PanelTab; label: string }[] = [
    { id: 'history', label: 'History' },
    { id: 'autopilot', label: 'Auto-Pilot' },
    { id: 'reporting', label: 'Reporting' },
    { id: 'note', label: 'Note' },
    { id: 'documents', label: 'Documents' },
  ]

  return (
    <>
      <div
        style={{
          position: 'absolute', top: 0, right: 0, width: '482px', height: '100%',
          background: '#FFFFFF', boxShadow: '-4px 0 32px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', zIndex: 20,
          animation: 'slideInRight 0.22s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* ── Panel header bar (48px) ── */}
        <div style={{ height: '48px', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <button type="button" onClick={onClose}
            style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="#6E738C" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <button
            ref={menuBtnRef}
            type="button"
            onClick={() => setShowPanelMenu(v => !v)}
            style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: showPanelMenu ? '#EFF0F5' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="4" r="1.2" fill="#6E738C"/>
              <circle cx="8" cy="8" r="1.2" fill="#6E738C"/>
              <circle cx="8" cy="12" r="1.2" fill="#6E738C"/>
            </svg>
          </button>
        </div>

        {/* ── Asset info section ── */}
        <div style={{ padding: '20px 24px 16px', flexShrink: 0 }}>
          {/* Logo then name — stacked (column) per spec */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '96px', border: '1px solid #EFF0F5', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, padding: '8px', boxSizing: 'border-box' }}>
              {asset.logo_url ? (
                <img src={asset.logo_url} alt={asset.name} style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '60px' }} />
              ) : asset.icon ? (
                <span dangerouslySetInnerHTML={{ __html: asset.icon }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }} />
              ) : (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#6E738C' }}>{(asset.ticker || asset.name).slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, lineHeight: '32px', letterSpacing: '-0.1px', color: '#2C2E35' }}>{asset.name}</span>
          </div>

          {/* Properties rows — label left (140px), value right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '140px', fontSize: '14px', lineHeight: '22px', color: '#6E738C', letterSpacing: '-0.1px', flexShrink: 0 }}>Asset Type</span>
              <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}</span>
            </div>
            {asset.ticker && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ width: '140px', fontSize: '14px', lineHeight: '22px', color: '#6E738C', letterSpacing: '-0.1px', flexShrink: 0 }}>Ticker</span>
                <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{asset.ticker}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '140px', fontSize: '14px', lineHeight: '22px', color: '#6E738C', letterSpacing: '-0.1px', flexShrink: 0 }}>Currency</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '16px', lineHeight: '1' }}>{currencyFlag(asset.currency)}</span>
                <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{asset.currency}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '140px', fontSize: '14px', lineHeight: '22px', color: '#6E738C', letterSpacing: '-0.1px', flexShrink: 0 }}>Current Value</span>
              <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{fmt(asset.owned_value_converted, asset.converted_currency)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '140px', fontSize: '14px', lineHeight: '22px', color: '#6E738C', letterSpacing: '-0.1px', flexShrink: 0 }}>Ownership</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{asset.ownership_pct}%</span>
                <div style={{ width: '57px', height: '4px', background: '#ECF7FF', borderRadius: '32px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '4px', width: `${Math.min(asset.ownership_pct, 100)}%`, background: '#033AB8', borderRadius: '32px' }} />
                </div>
              </div>
            </div>
            {folderName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ width: '140px', fontSize: '14px', lineHeight: '22px', color: '#6E738C', letterSpacing: '-0.1px', flexShrink: 0 }}>Folder</span>
                <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{folderName}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '140px', fontSize: '14px', lineHeight: '22px', color: '#6E738C', letterSpacing: '-0.1px', flexShrink: 0 }}>Last Updated</span>
              <span style={{ fontSize: '14px', lineHeight: '22px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{fmtDateShort(asset.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* ── Tab bar (40px) ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid #EFF0F5', padding: '0 24px', gap: '24px', flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              style={{
                height: '40px', border: 'none', background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0',
                fontSize: '14px', fontWeight: 500,
                color: tab === t.id ? '#2C2E35' : '#6E738C',
                borderBottom: tab === t.id ? '2px solid #033AB8' : '2px solid transparent',
                marginBottom: '-1px', whiteSpace: 'nowrap', boxSizing: 'border-box',
              }}>
              {t.label}
              {t.id === 'autopilot' && rules.length > 0 && (
                <span style={{ minWidth: '16px', height: '16px', borderRadius: '50%', background: tab === t.id ? '#033AB8' : '#B3B8CB', color: '#FFF', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  {rules.length}
                </span>
              )}
              {t.id === 'note' && (notes?.length ?? 0) > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', height: '20px', minWidth: '18px', background: '#EFF0F5', border: '0.5px solid #E3E5ED', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>
                  {notes?.length ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content + CTA wrapper ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column' }}>

          {/* HISTORY */}
          {tab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!lots?.length ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: '13px', color: '#B3B8CB' }}>No history available</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#EFF0F5', borderRadius: '12px', overflow: 'hidden' }}>
                  {lots.map((lot: AssetLot) => (
                    <div key={lot.id} style={{ background: '#FFF', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C2E35' }}>{lot.quantity.toLocaleString()} units acquired</div>
                        <div style={{ fontSize: '11px', color: '#B3B8CB', marginTop: '2px' }}>{fmtDateShort(lot.acquisition_date)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C2E35' }}>
                          {lot.acquisition_price != null ? fmt(lot.acquisition_price, asset.currency) : '—'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#B3B8CB' }}>per unit</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AUTOPILOT */}
          {tab === 'autopilot' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rules.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', minHeight: '240px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EFF0F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2l1.8 4 4.2.6-3 2.9.7 4.2L10 11.8l-3.7 1.9.7-4.2-3-2.9 4.2-.6L10 2z" stroke="#B3B8CB" strokeWidth="1.3" strokeLinejoin="round"/>
                      <path d="M3 17h14" stroke="#B3B8CB" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C2E35' }}>No Auto-Pilot Rules Added</div>
                  <div style={{ fontSize: '12px', color: '#B3B8CB', textAlign: 'center', maxWidth: '220px', lineHeight: '1.5' }}>
                    Create a rule to automatically add or remove this asset on a schedule.
                  </div>
                </div>
              ) : (
                rules.map(rule => (
                  <div key={rule.id} style={{ background: '#F9F9FB', borderRadius: '12px', padding: '12px 14px', opacity: rule.is_active ? 1 : 0.55 }}>
                    {/* Date range + menu */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#B3B8CB', fontWeight: 500 }}>
                        {fmtDateRange(rule.start_date, rule.end_date)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {!rule.is_active && (
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#6E738C', background: '#EFF0F5', borderRadius: '4px', padding: '1px 6px' }}>Paused</span>
                        )}
                        <RuleMenu
                          rule={rule}
                          portfolioId={portfolioId}
                          onEdit={() => setShowAddRule(true)}
                          onPause={() => setPausingRule(rule)}
                          onResume={() => qc.invalidateQueries({ queryKey: ['autopilot-rules', portfolioId] })}
                          onDelete={() => qc.invalidateQueries({ queryKey: ['autopilot-rules', portfolioId] })}
                        />
                      </div>
                    </div>
                    {/* Action + frequency */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: rule.action === 'add' ? '#008753' : '#F03722' }}>
                        {rule.action === 'add' ? 'Add' : 'Remove'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6E738C', fontWeight: 500 }}>{FREQ_LABELS[rule.frequency] ?? rule.frequency}</span>
                    </div>
                    {/* Amount + next execution */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: rule.action === 'add' ? '#008753' : '#F03722' }}>
                        {rule.action === 'add' ? '+' : '−'}
                        {rule.units != null
                          ? `${rule.units.toLocaleString()}${asset.ticker ? ` $${asset.ticker}` : ' units'}`
                          : fmt(rule.amount, asset.currency)
                        }
                      </span>
                      {rule.next_run_at && (
                        <span style={{ fontSize: '11px', color: '#B3B8CB' }}>
                          Next Execution: {fmtDateShort(rule.next_run_at)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Sticky Add Rule button */}
              <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                <button type="button" onClick={() => setShowAddRule(true)}
                  style={{ width: '100%', height: '40px', borderRadius: '10px', border: 'none', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Add Rule
                </button>
              </div>
            </div>
          )}

          {/* REPORTING */}
          {tab === 'reporting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>

              {/* ── Asset Classification ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Asset Classification</span>
                  <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px' }}>This determines whether an asset can be easily accessible as cash or not</span>
                </div>

                {([
                  { value: 'cash', label: 'Investable', desc: 'Cash (Checking, Savings, Money Market)' },
                  { value: 'investable', label: 'Investable', desc: 'Can be easily converted to cash (stocks, bonds, crypto, mutual funds)' },
                  { value: 'non_investable', label: 'Non-Investable', desc: 'Real estate, Physical valuables, Illiquid private investments' },
                ] as { value: string; label: string; desc: string }[]).map(opt => {
                  const selected = reportInvestability === opt.value
                  const canToggle = asset.investability_editable
                  return (
                    <div
                      key={opt.value}
                      onClick={() => canToggle && setReportInvestability(opt.value)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', opacity: selected ? 1 : 0.5, cursor: canToggle ? 'pointer' : 'default' }}
                    >
                      <div style={{ marginTop: '3px', width: '16px', height: '16px', flexShrink: 0, borderRadius: '100px', background: selected ? 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)' : '#FFFFFF', boxShadow: selected ? 'none' : '0px 2px 2px -1px rgba(17,29,80,0.04), 0px 4px 2px -1px rgba(17,29,80,0.04), 0px 0px 0px 0.5px rgba(17,29,80,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF' }} />}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px', lineHeight: '22px' }}>{opt.label}</span>
                        <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px' }}>{opt.desc}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── Ownership Percentage ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Ownership Percentage</span>
                  <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px' }}>This is how much of the asset you own</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: '#EFF0F5', borderRadius: '12px', height: '40px', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', flexShrink: 0 }}>
                    <span style={{ fontSize: '14px', color: '#B3B8CB', lineHeight: '22px' }}>%</span>
                  </div>
                  <input
                    type="number"
                    value={reportOwnershipPct}
                    onChange={e => setReportOwnershipPct(e.target.value)}
                    min={0} max={100} step={0.01}
                    placeholder="0.00"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '8px 16px 8px 0', fontSize: '14px', color: '#2C2E35', fontFamily: 'var(--font-sans)', lineHeight: '22px' }}
                  />
                </div>
              </div>

              {/* ── Save button ── */}
              <div style={{ marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => updateAsset()}
                  disabled={savingAsset}
                  style={{ width: '100%', height: '40px', borderRadius: '10px', border: 'none', background: reportSaved ? '#22C55E' : 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: savingAsset ? 'not-allowed' : 'pointer', opacity: savingAsset ? 0.7 : 1, transition: 'background 0.2s' }}
                >
                  {savingAsset ? 'Saving…' : reportSaved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>

            </div>
          )}

          {/* NOTE */}
          {tab === 'note' && (
            notes?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notes.map((note: AssetNote) => {
                  const tagList = note.tags?.items ?? []
                  return (
                    <div key={note.id} style={{ background: '#F9F9FB', borderRadius: '12px' }}>
                      {/* Note card header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px', height: '26px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 500, color: '#6E738C', letterSpacing: '1px', textTransform: 'uppercase' }}>{note.title || 'NOTE'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <button type="button" onClick={() => openCompose(note)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#B3B8CB' }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.3 2.7a1.5 1.5 0 012.1 2.1L5 13.3l-3 .7.7-3 8.6-8.3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                          </button>
                          <button type="button" onClick={() => deleteNote(note.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#B3B8CB' }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M5 4V3h6v1M6 7v4M10 7v4M4 4l.7 9h6.6L12 4H4z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>
                      </div>
                      {/* Note card body */}
                      <div style={{ background: '#FFFFFF', border: '1px solid #EFF0F5', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px', lineHeight: '22px' }}>{note.title || 'Untitled'}</span>
                        <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{note.content}</span>
                        {tagList.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                            {tagList.map(tag => (
                              <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', padding: '0 4px', height: '20px', background: '#EFF0F5', border: '0.5px solid #E3E5ED', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '280px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px', textAlign: 'center' }}>No notes added</span>
                <span style={{ fontSize: '12px', color: '#6E738C', textAlign: 'center', maxWidth: '220px', lineHeight: '20px' }}>Add notes to keep track of information about this asset.</span>
              </div>
            )
          )}

          {/* DOCUMENTS */}
          {tab === 'documents' && (
            <>
              <input ref={docFileRef} type="file" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) { uploadDoc(f); if (docFileRef.current) docFileRef.current.value = '' } }} />
              {documents?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {documents.map((doc: AssetDocument) => (
                    <div key={doc.id} style={{ background: '#F9F9FB', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF0F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8 2H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V5L8 2z" stroke="#6E738C" strokeWidth="1.2" strokeLinejoin="round"/><path d="M8 2v3h3" stroke="#6E738C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#2C2E35', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</div>
                        <div style={{ fontSize: '11px', color: '#B3B8CB', marginTop: '1px' }}>{fmtFileSize(doc.file_size)} · {fmtDateShort(doc.uploaded_at)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button type="button" onClick={() => handleDownload(doc)}
                          style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: '#EFF0F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v6M4 6l2 2 2-2" stroke="#6E738C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10h8" stroke="#6E738C" strokeWidth="1.2" strokeLinecap="round"/></svg>
                        </button>
                        <button type="button" onClick={() => deleteDoc(doc.id)}
                          style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: '#FFF0EE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4 3V2h4v1M5 5.5v3M7 5.5v3M3 3l.5 7h5l.5-7H3z" stroke="#F03722" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '280px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px', textAlign: 'center' }}>No documents added</span>
                  <span style={{ fontSize: '12px', color: '#6E738C', textAlign: 'center', maxWidth: '220px', lineHeight: '20px' }}>Upload documents related to this asset for easy access.</span>
                </div>
              )}
            </>
          )}

        </div>

        {/* CTA strip — pinned to bottom of panel for note/docs tabs */}
        {(tab === 'note' || tab === 'documents') && (
          <div style={{ height: '76px', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderTop: '1px solid rgba(239,240,245,0.8)' }}>
            {tab === 'note' && (
              <button type="button" onClick={() => openCompose()}
                style={{ height: '32px', padding: '0 12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PlusCircleIcon color="#FFF" size={14} />
                Add Note
              </button>
            )}
            {tab === 'documents' && (
              <button type="button" onClick={() => docFileRef.current?.click()} disabled={uploadingDoc}
                style={{ height: '32px', padding: '0 12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: uploadingDoc ? 0.7 : 1 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 9V4M5 6l2-2 2 2" stroke="#FFF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.5 11h9" stroke="#FFF" strokeWidth="1.3" strokeLinecap="round"/></svg>
                {uploadingDoc ? 'Uploading…' : 'Upload Document'}
              </button>
            )}
          </div>
        )}
        </div>{/* closes tab content + CTA wrapper */}
      </div>

      {/* Modals rendered via portal */}
      {noteModalOpen && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}
          onClick={() => { setNoteModalOpen(false); setEditingNote(null) }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,3,0.4)' }} />
          <div
            style={{ position: 'relative', width: '426px', marginTop: '104px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 4px 4px -2px rgba(17,29,80,0.04), 0px 2px 2px -1px rgba(17,29,80,0.04), 0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.08)', display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.2s cubic-bezier(0.16,1,0.3,1) both' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ height: '54px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EFF0F5', flexShrink: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>{editingNote ? 'Edit Note' : 'Add Note'}</span>
              <button type="button" onClick={() => { setNoteModalOpen(false); setEditingNote(null) }}
                style={{ width: '28px', height: '28px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="#6E738C" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Title field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Title</label>
                <div style={{ background: '#F9F9FB', borderRadius: '12px', height: '40px', display: 'flex', alignItems: 'center' }}>
                  <input
                    value={noteTitle}
                    onChange={e => setNoteTitle(e.target.value)}
                    placeholder="Note title"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '8px 16px', fontSize: '14px', color: '#2C2E35', fontFamily: 'var(--font-sans)', letterSpacing: '-0.1px' }}
                  />
                </div>
              </div>
              {/* Notes field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Notes</label>
                  <span style={{ fontSize: '14px', color: '#F03722' }}>*</span>
                </div>
                <div style={{ background: '#F9F9FB', borderRadius: '12px', height: '120px' }}>
                  <textarea
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    placeholder="Write your note here…"
                    style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '10px 16px', fontSize: '14px', color: '#2C2E35', fontFamily: 'var(--font-sans)', letterSpacing: '-0.1px', resize: 'none', lineHeight: '22px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              {/* Tags field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Tags</label>
                <div style={{ background: '#F9F9FB', borderRadius: '12px', height: '40px', display: 'flex', alignItems: 'center' }}>
                  <input
                    value={noteTags}
                    onChange={e => setNoteTags(e.target.value)}
                    placeholder="e.g. Finance, Investment"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '8px 16px', fontSize: '14px', color: '#2C2E35', fontFamily: 'var(--font-sans)', letterSpacing: '-0.1px' }}
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #EFF0F5', flexShrink: 0 }}>
              <button type="button" onClick={() => { setNoteModalOpen(false); setEditingNote(null) }}
                style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)', boxShadow: '0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.1)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#2C2E35' }}>
                Cancel
              </button>
              <button type="button" onClick={() => saveNote()} disabled={savingNote || !noteContent.trim()}
                style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: 'none', background: !noteContent.trim() ? '#E3E5ED' : 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', cursor: !noteContent.trim() ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, color: !noteContent.trim() ? '#B3B8CB' : '#FFFFFF', transition: 'background 0.15s' }}>
                {savingNote ? 'Saving…' : editingNote ? 'Save Changes' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showAddRule && (
        <AddRuleModal
          asset={asset}
          portfolioId={portfolioId}
          onClose={() => setShowAddRule(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ['autopilot-rules', portfolioId] })}
        />
      )}
      {pausingRule && (
        <PauseRuleDialog
          rule={pausingRule}
          portfolioId={portfolioId}
          onClose={() => setPausingRule(null)}
          onPaused={() => qc.invalidateQueries({ queryKey: ['autopilot-rules', portfolioId] })}
        />
      )}

      {/* ⋮ Dots dropdown menu */}
      {showPanelMenu && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setShowPanelMenu(false)} />
          <div style={{
            position: 'fixed',
            top: (menuBtnRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
            left: (menuBtnRef.current?.getBoundingClientRect().right ?? 0) - 191,
            width: '191px',
            background: '#FFFFFF',
            borderRadius: '10px',
            boxShadow: '0px 8px 8px -1px rgba(17,29,80,0.06), 0px 4px 4px -2px rgba(17,29,80,0.04), 0px 2px 2px -1px rgba(17,29,80,0.04), 0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.08)',
            padding: '2px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            zIndex: 300,
          }}>
            {([
              { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="8" rx="5.5" ry="3.5" stroke="#6E738C" strokeWidth="1.2"/><circle cx="8" cy="8" r="1.5" fill="#6E738C"/></svg>, label: 'View Details', color: '#2C2E35', action: () => { setShowPanelMenu(false) } },
               { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5a1 1 0 011-1h3l1.5 1.5H13a1 1 0 011 1V12a1 1 0 01-1 1H3a1 1 0 01-1-1V5z" stroke="#6E738C" strokeWidth="1.2" strokeLinejoin="round"/></svg>, label: 'Move to Folder', color: '#2C2E35', action: () => { setShowPanelMenu(false); setShowMoveModal(true) } },
               { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 13V4M3 4l2.5 2.5M3 4L0.5 6.5" stroke="#6E738C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 3h6M7 7h5M7 11h4" stroke="#6E738C" strokeWidth="1.2" strokeLinecap="round"/></svg>, label: 'Report Asset', color: '#2C2E35', action: () => { setShowPanelMenu(false); setTab('reporting') } },
            ] as { icon: React.ReactNode; label: string; color: string; action: () => void }[]).map(item => (
              <button key={item.label} type="button" onClick={item.action}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EFF0F5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ display: 'flex', alignItems: 'center', width: '16px', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1, padding: '0 4px', fontSize: '14px', fontWeight: 500, color: item.color, letterSpacing: '0.1px', lineHeight: '22px' }}>{item.label}</span>
              </button>
            ))}
            {/* Divider */}
            <div style={{ padding: '2px 10px' }}><div style={{ height: '1px', background: '#EFF0F5' }} /></div>
            {/* Delete */}
            <button type="button" onClick={() => { setShowPanelMenu(false); setShowDeleteModal(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FFF0EE')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ display: 'flex', alignItems: 'center', width: '16px', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M5 4V3h6v1M6 7v4M10 7v4M4 4l.7 9h6.6L12 4H4z" stroke="#F03722" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <span style={{ flex: 1, padding: '0 4px', fontSize: '14px', fontWeight: 500, color: '#F03722', letterSpacing: '0.1px', lineHeight: '22px' }}>Delete Asset</span>
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Move to Folder modal */}
      {showMoveModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}
          onClick={() => setShowMoveModal(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,3,0.4)' }} />
          <div style={{ position: 'relative', width: '426px', marginTop: '104px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 4px 4px -2px rgba(17,29,80,0.04), 0px 2px 2px -1px rgba(17,29,80,0.04), 0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.08)', display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.2s cubic-bezier(0.16,1,0.3,1) both', maxHeight: 'calc(100vh - 128px)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            <MoveFolderModalContent
              asset={asset}
              folders={folders ?? []}
              allAssets={allAssets ?? []}
              isPending={movingAsset}
              onMove={folderId => moveAsset(folderId)}
              onClose={() => setShowMoveModal(false)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Delete Asset modal */}
      {showDeleteModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}
          onClick={() => setShowDeleteModal(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,3,0.4)' }} />
          <div style={{ position: 'relative', width: '426px', marginTop: '104px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0px 4px 4px -2px rgba(17,29,80,0.04), 0px 2px 2px -1px rgba(17,29,80,0.04), 0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.08)', display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.2s cubic-bezier(0.16,1,0.3,1) both' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ height: '54px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EFF0F5', flexShrink: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Delete {asset.name}?</span>
              <button type="button" onClick={() => setShowDeleteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="#6E738C" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            {/* Body */}
            <div style={{ padding: '16px 20px' }}>
              <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px', display: 'block' }}>
                Are you sure you want to delete <strong style={{ color: '#2C2E35' }}>{asset.name}</strong>? This will permanently remove the asset and all its associated data including history, notes, and documents. This action cannot be undone.
              </span>
            </div>
            {/* Footer */}
            <div style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #EFF0F5', flexShrink: 0 }}>
              <button type="button" onClick={() => setShowDeleteModal(false)}
                style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)', boxShadow: '0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.1)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#2C2E35' }}>
                Cancel
              </button>
              <button type="button" onClick={() => deleteAsset()} disabled={deletingAsset}
                style={{ height: '28px', padding: '0 10px', borderRadius: '6px', border: 'none', background: 'linear-gradient(180deg, #F03722 0%, #C91F0C 100%)', cursor: deletingAsset ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', opacity: deletingAsset ? 0.7 : 1 }}>
                {deletingAsset ? 'Deleting…' : 'Delete Asset'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}


// ─── Main page ────────────────────────────────────────────────────────────────
export function AssetsPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [showCards, setShowCards] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null)

  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const currentPortfolioId = useAuthStore((s) => s.currentPortfolioId)
  const setCurrentPortfolioId = useAuthStore((s) => s.setCurrentPortfolioId)

  const userInitials = user ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() : '?'

  // Portfolios — only fetched as fallback when currentPortfolioId is not yet in the store
  const { data: portfolios } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => portfolioApi.list().then((r) => r.data.data?.items ?? []),
    staleTime: 5 * 60_000,
    enabled: !currentPortfolioId,
  })
  const firstPortfolio = portfolios?.[0] ?? null
  const portfolioId = currentPortfolioId ?? firstPortfolio?.id ?? ''

  // Persist portfolioId to store once we have it from the fallback fetch
  useEffect(() => {
    if (!currentPortfolioId && firstPortfolio?.id) {
      setCurrentPortfolioId(firstPortfolio.id)
    }
  }, [currentPortfolioId, firstPortfolio?.id, setCurrentPortfolioId])
  const currency = firstPortfolio?.base_currency ?? 'USD'
  const avatarId: AvatarId = firstPortfolio?.image_url?.startsWith('avatar:')
    ? (firstPortfolio.image_url.slice(7) as AvatarId)
    : 'lime'

  // Folders
  const { data: folders } = useQuery({
    queryKey: ['folders', portfolioId],
    queryFn: () => folderApi.list(portfolioId, 'asset').then((r) => r.data.data ?? []),
    enabled: !!portfolioId,
    staleTime: 2 * 60_000,
  })

  // Auto-select first folder
  useEffect(() => {
    if (folders && folders.length > 0 && !selectedFolderId) {
      setSelectedFolderId(folders[0].id)
    }
  }, [folders, selectedFolderId])

  // Assets — scoped server-side to the selected folder (?folder_id=…).
  const { data: assets, isLoading: loadingAssets } = useQuery({
    queryKey: ['assets', portfolioId, selectedFolderId],
    queryFn: () => assetApi.list(portfolioId, selectedFolderId ?? undefined).then((r) => r.data.data ?? []),
    enabled: !!portfolioId,
    staleTime: 60_000,
  })

  // Full (unscoped) asset list — only needed for the "Move to folder" modal's
  // per-folder counts, so fetch lazily once an asset panel is open.
  const { data: allAssets } = useQuery({
    queryKey: ['assets', portfolioId, 'all'],
    queryFn: () => assetApi.list(portfolioId).then((r) => r.data.data ?? []),
    enabled: !!portfolioId && !!selectedAsset,
    staleTime: 60_000,
  })

  // Overview (for header growth)
  const { data: overview } = useQuery({
    queryKey: ['assets-overview', portfolioId],
    queryFn: () => assetApi.overview(portfolioId).then((r) => r.data.data!),
    enabled: !!portfolioId,
    staleTime: 60_000,
  })

  // Server already scoped the list to the selected folder.
  const folderAssets = assets ?? []

  const totalValue = overview?.total_assets?.value ?? folderAssets.reduce((s, a) => s + a.owned_value_converted, 0)
  const growth = overview?.growth_30d
  const growthPositive = (growth?.percentage ?? 0) >= 0

  const handleLogout = () => { clearAuth(); navigate({ to: '/login' }) }

  return (
    <div className="flex" style={{ minHeight: '100dvh', background: '#F9F9FB', fontFamily: 'var(--font-sans)' }}>
      <Sidebar
        portfolioName={firstPortfolio?.name ?? 'My portfolio'}
        avatarId={avatarId}
        activeSection="assets"
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col" style={{ background: '#FFF', boxShadow: PANEL_SHADOW, borderRadius: '16px 0 0 16px', minHeight: '100dvh', overflow: 'hidden', position: 'relative' }}>
        {/* ── Header ── */}
        <header className="flex items-center justify-between shrink-0" style={{ padding: '12px 40px', height: '56px', borderBottom: '1px solid #EFF0F5', position: 'sticky', top: 0, background: '#FFF', zIndex: 10 }}>
          <div className="flex items-center gap-2" style={{ width: '400px', height: '32px', padding: '0 12px', background: '#EFF0F5', borderRadius: '10px', cursor: 'text' }}>
            <SearchIcon />
            <span style={{ fontSize: '14px', color: '#6E738C', flex: 1 }}>Search</span>
            <span style={{ fontSize: '11px', fontWeight: 500, color: '#B3B8CB', background: '#E3E5ED', borderRadius: '4px', padding: '1px 5px' }}>⌘K</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <RefreshIcon />
              <span style={{ fontSize: '12px', color: '#6E738C' }}>Last updated: just now</span>
            </div>
            <div className="flex items-center gap-3">
              {firstPortfolio && (
                <CurrencySelector currentCode={firstPortfolio.base_currency} portfolioId={firstPortfolio.id}
                  onUpdated={() => qc.invalidateQueries({ queryKey: ['assets-overview', portfolioId] })} />
              )}
              <div className="flex items-center justify-center font-semibold text-white" style={{ width: '20px', height: '20px', borderRadius: '33px', background: '#033AB8', fontSize: '8px', flexShrink: 0, letterSpacing: '0.3px' }}>
                {userInitials}
              </div>
              <button type="button" className="flex items-center justify-center text-white font-semibold hover:opacity-90 active:scale-[0.97] transition-[opacity,transform]"
                style={{ width: '54px', height: '28px', borderRadius: '6px', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', fontSize: '12px', border: 'none', cursor: 'pointer' }}>
                Share
              </button>
            </div>
          </div>
        </header>

        {/* ── Section header ── */}
        <div className="flex items-center justify-between" style={{ padding: '20px 40px 0' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#6E738C', marginBottom: '6px' }}>Assets</div>
            <div className="flex items-center gap-3">
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.3px', color: '#2C2E35' }}>
                {fmt(totalValue, currency)}
              </span>
              {growth != null && (
                <div className="flex items-center gap-1.5" style={{ padding: '3px 8px', borderRadius: '6px', background: growthPositive ? '#F0FBF4' : '#FEF2F2' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: growthPositive ? '#008753' : '#C50F3C' }}>
                    {growthPositive ? '↗' : '↘'} {fmt(Math.abs(growth.amount), currency)} ({Math.abs(growth.percentage).toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled
              className="flex items-center gap-1.5 opacity-50 cursor-not-allowed"
              style={{ height: '32px', padding: '0 12px', borderRadius: '8px', background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)', boxShadow: BTN_SHADOW, border: 'none', fontSize: '13px', fontWeight: 500, color: '#2C2E35', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ExportIcon />
              Export
            </button>
            <button type="button" onClick={() => setShowAddModal(true)} disabled={!portfolioId}
              className="flex items-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-[opacity,transform] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ height: '32px', padding: '0 14px', borderRadius: '8px', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', border: 'none', fontSize: '13px', fontWeight: 600, color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.3" /><path d="M7 4v6M4 7h6" stroke="white" strokeWidth="1.3" strokeLinecap="round" /></svg>
              Create Asset
            </button>
          </div>
        </div>

        {/* ── Folder tabs ── */}
        {folders && (
          <FolderTabs
            folders={folders}
            selectedId={selectedFolderId}
            onSelect={setSelectedFolderId}
            portfolioId={portfolioId}
            onFolderCreated={(id) => setSelectedFolderId(id)}
            showCards={showCards}
            onToggleCards={() => setShowCards(v => !v)}
          />
        )}

        {/* ── Overview cards ── */}
        <AssetsOverview assets={folderAssets} currency={currency} loading={loadingAssets && !assets} showCards={showCards} />

        {/* ── Asset table ── */}
        <AssetTable
          assets={folderAssets}
          loading={loadingAssets && !assets}
          onAddAsset={() => setShowAddModal(true)}
          onOpenPanel={(asset) => setSelectedAsset(asset)}
        />

        {/* ── Asset side panel ── */}
        {selectedAsset && (
          <AssetSidePanel
            asset={selectedAsset}
            portfolioId={portfolioId}
            folders={folders}
            allAssets={allAssets}
            onClose={() => setSelectedAsset(null)}
          />
        )}
      </div>

      {/* ── Modal ── */}
      {showAddModal && (
        <AddAssetModal
          portfolioId={portfolioId}
          folderId={selectedFolderId ?? ''}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['assets', portfolioId] })
            qc.invalidateQueries({ queryKey: ['assets-overview', portfolioId] })
          }}
        />
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(32px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}
