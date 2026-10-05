import { useEffect, useRef, useState } from 'react'
import { CloseIcon, DotsIcon, SearchIcon } from '@/components/icons'
import { formatCurrency } from '@/lib/format'
import { PANEL_SHADOW } from '@/lib/shadows'
import { ASSET_TYPE_LABELS } from '../../constants'
import type { AssetItem } from '../../types'
import { SortIcon } from '../icons'
import { FilterBtn } from './filter-btn'
import { PerformanceBadge } from './performance-badge'

export function AssetTable({
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
          <div className="flex flex-col items-center justify-center gap-4" style={{ flex: 1, padding: '48px 40px', animation: 'fadeInUpSm 0.4s ease both' }}>
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
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C2E35' }}>{formatCurrency(asset.owned_value_converted, asset.converted_currency)}</div>
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
