import { ASSET_TYPES, type AssetTypeConfig } from './asset-types'

export function TypeSelectStep({
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
