import { useState } from 'react'
import { CloseIcon } from '@/components/icons'
import { getErrorMessage } from '@/lib/api-client'
import { BTN_SHADOW } from '@/lib/shadows'
import { useCreateAsset } from '../../queries'
import type { CreateAssetInput, TickerSearchResult } from '../../types'
import { ManualStockStep } from './manual-stock-step'
import { StockDetailsStep } from './stock-details-step'
import { StockSearchStep } from './stock-search-step'
import { TypeSelectStep } from './type-select-step'
import type { AddAssetStep, Lot, ManualStockForm } from './types'

export function AddAssetModal({
  portfolioId, folderId, onClose, onSuccess,
}: {
  portfolioId: string
  folderId: string
  onClose: () => void
  onSuccess?: () => void
}) {
  const [step, setStep] = useState<AddAssetStep>('type-select')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedTicker, setSelectedTicker] = useState<TickerSearchResult | null>(null)
  const [lots, setLots] = useState<Lot[]>([{ quantity: '', date: '' }])
  const [manualForm, setManualForm] = useState<ManualStockForm>({
    name: '', ticker: '', price: '', currency: 'USD', lots: [{ quantity: '', date: '' }], imageUrl: null,
  })
  const [mutationError, setMutationError] = useState<string | null>(null)

  const { mutate: create, isPending: creating } = useCreateAsset(portfolioId)

  const createAsset = () => {
    const build = (): CreateAssetInput => {
        if (!portfolioId) throw new Error('Portfolio not loaded. Please try again.')
        if (!folderId) throw new Error('No folder selected. Please try again.')
        const isManual = step === 'stock-manual'
      return isManual ? {
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
        }
    }
    let input: CreateAssetInput
    try {
      input = build()
    } catch (err) {
      setMutationError((err as Error).message)
      return
    }
    create(input, {
      onSuccess: () => {
        setMutationError(null)
        onSuccess?.()
        onClose()
      },
      onError: (err) => setMutationError(getErrorMessage(err, 'Something went wrong. Please try again.')),
    })
  }

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
