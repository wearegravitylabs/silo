import { formatCurrency, formatDate } from '@/lib/format'
import { useAssetLots } from '../../queries'
import type { AssetItem, AssetLot } from '../../types'
import { TabBody } from './tab-layout'

export function HistoryTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const { data: lots } = useAssetLots(portfolioId, asset.id)
  return (
    <TabBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!lots?.length ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: '13px', color: '#B3B8CB' }}>No history available</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#EFF0F5', borderRadius: '12px', overflow: 'hidden' }}>
              {lots.map((lot: AssetLot) => (
                <div key={lot.id} style={{ background: '#FFF', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C2E35' }}>{lot.quantity.toLocaleString()} units acquired</div>
                    <div style={{ fontSize: '11px', color: '#B3B8CB', marginTop: '2px' }}>{formatDate(lot.acquisition_date)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C2E35' }}>
                      {lot.acquisition_price != null ? formatCurrency(lot.acquisition_price, asset.currency) : '—'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#B3B8CB' }}>per unit</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </TabBody>
  )
}
