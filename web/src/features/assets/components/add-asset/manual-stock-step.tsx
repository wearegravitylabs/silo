import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon, CloseIcon, PlusCircleIcon } from '@/components/icons'
import { currencyFlag } from '@/lib/format'
import { DROPDOWN_SHADOW, PANEL_SHADOW } from '@/lib/shadows'
import { uploadFile } from '../../api'
import { CalendarIcon } from '../icons'
import type { ManualStockForm } from './types'

export function ManualStockStep({
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
      const uploaded = await uploadFile(file)
      onChange({ ...form, imageUrl: uploaded.url })
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
