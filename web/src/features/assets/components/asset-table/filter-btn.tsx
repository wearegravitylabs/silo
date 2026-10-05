import { ChevronDownIcon } from '@/components/icons'
import { BTN_SHADOW, DROPDOWN_SHADOW } from '@/lib/shadows'

export function FilterBtn({ label, value, options, open, onOpen, onSelect }: {
  label: string; value: string | null; options: { label: string; value: string | null }[]
  open: boolean; onOpen: () => void; onSelect: (v: string | null) => void
}) {
  return (
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
}
