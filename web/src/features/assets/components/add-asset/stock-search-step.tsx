import { useState } from 'react'
import { CloseIcon, PlusCircleIcon, SearchIcon } from '@/components/icons'
import { useDebounce } from '@/hooks/use-debounce'
import { useTickerSearch } from '../../queries'
import type { TickerSearchResult } from '../../types'
import { YahooAttribution } from './yahoo-attribution'

export function StockSearchStep({
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
  const query = useDebounce(input.trim(), 350)
  const { data: results, isFetching } = useTickerSearch(portfolioId, query)

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
