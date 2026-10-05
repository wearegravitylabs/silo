import { CloseIcon, PlusCircleIcon } from '@/components/icons'
import { formatCurrency } from '@/lib/format'
import { useTickerPreview } from '../../queries'
import type { TickerSearchResult } from '../../types'
import { CalendarIcon } from '../icons'
import type { Lot } from './types'
import { YahooAttribution } from './yahoo-attribution'

export function StockDetailsStep({
  portfolioId, ticker, lots, onLotsChange, creating, onSubmit,
}: {
  portfolioId: string
  ticker: TickerSearchResult
  lots: Lot[]
  onLotsChange: (lots: Lot[]) => void
  creating: boolean
  onSubmit: () => void
}) {
  const { data: quote } = useTickerPreview(portfolioId, ticker.ticker)

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
              { label: 'Current Price', value: quote ? `${formatCurrency(quote.price, quote.currency)} ${quote.currency}` : '—' },
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
