import { useRef, useState } from 'react'
import { ChevronDownIcon, SearchIcon } from '@/components/icons'
import { useClickOutside } from '@/hooks/use-click-outside'
import { currencyFlag } from '@/lib/format'
import { BTN_SHADOW, DROPDOWN_SHADOW } from '@/lib/shadows'
import { useCurrencies, useUpdatePortfolio } from '../queries'

/** Header dropdown that changes the portfolio's base currency. */
export function CurrencySelector({ portfolioId, currentCode }: { portfolioId: string; currentCode: string }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const { data: currencies = [] } = useCurrencies()
  const filtered = search.trim()
    ? currencies.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
    : currencies

  const { mutate: update, isPending } = useUpdatePortfolio(portfolioId)
  const close = () => {
    setOpen(false)
    setSearch('')
  }
  const updateCurrency = (code: string) => update({ base_currency: code }, { onSuccess: close })

  useClickOutside([ref], close, open)

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
