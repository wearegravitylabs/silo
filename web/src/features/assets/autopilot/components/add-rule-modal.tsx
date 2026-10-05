import { useState } from 'react'
import { createPortal } from 'react-dom'
import { getErrorMessage } from '@/lib/api-client'
import type { AssetItem } from '../../types'
import { FREQ_LABELS } from '../constants'
import { useRuleMutations } from '../queries'

export type AmountType = 'amount' | 'units'

export interface RuleFormState {
  action: 'add' | 'remove'
  amountType: AmountType
  value: string
  frequency: string
  startDate: string
  endDate: string
}

export const EMPTY_RULE_FORM: RuleFormState = {
  action: 'add', amountType: 'units', value: '', frequency: 'weekly', startDate: '', endDate: '',
}

export function AddRuleModal({
  asset, portfolioId, onClose, onSaved,
}: {
  asset: AssetItem
  portfolioId: string
  onClose: () => void
  onSaved?: () => void
}) {
  const [form, setForm] = useState<RuleFormState>(EMPTY_RULE_FORM)
  const [error, setError] = useState<string | null>(null)

  const { create } = useRuleMutations(portfolioId)
  const isPending = create.isPending

  const save = () => {
    setError(null)
    const val = parseFloat(form.value)
    if (isNaN(val) || val <= 0) return setError('Enter a valid amount')
    if (!form.startDate) return setError('Start date is required')
    create.mutate({
      target_id: asset.id,
      target_type: 'asset',
      action: form.action,
      ...(form.amountType === 'units' ? { units: val } : { amount: val }),
      frequency: form.frequency,
      start_date: new Date(form.startDate).toISOString(),
      ...(form.endDate ? { end_date: new Date(form.endDate).toISOString() } : {}),
    }, {
      onSuccess: () => { onSaved?.(); onClose() },
      onError: (e) => setError(getErrorMessage(e, 'Failed to save rule')),
    })
  }

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
      <div style={{ position: 'relative', width: '440px', background: '#FFF', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', animation: 'fadeInUpSm 0.2s cubic-bezier(0.16,1,0.3,1) both' }}>
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
