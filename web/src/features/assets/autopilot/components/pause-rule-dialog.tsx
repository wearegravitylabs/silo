import { createPortal } from 'react-dom'
import { useRuleMutations } from '../queries'
import type { AutopilotRule } from '../types'

export function PauseRuleDialog({
  rule, portfolioId, onClose, onPaused,
}: {
  rule: AutopilotRule
  portfolioId: string
  onClose: () => void
  onPaused?: () => void
}) {
  const { pause: pauseRule } = useRuleMutations(portfolioId)
  const isPending = pauseRule.isPending
  const pause = () => pauseRule.mutate(rule.id, { onSuccess: () => { onPaused?.(); onClose() } })
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,3,0.45)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '380px', background: '#FFF', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.16)', animation: 'fadeInUpSm 0.18s cubic-bezier(0.16,1,0.3,1) both' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#2C2E35' }}>Pause Rule</div>
        <div style={{ fontSize: '13px', color: '#6E738C', lineHeight: '1.6' }}>
          This will pause this rule. The rule will not execute until you resume it.
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose}
            style={{ height: '36px', padding: '0 16px', borderRadius: '9px', border: '1px solid #EFF0F5', background: '#FFF', color: '#6E738C', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            Close
          </button>
          <button type="button" onClick={() => pause()} disabled={isPending}
            style={{ height: '36px', padding: '0 18px', borderRadius: '9px', border: 'none', background: '#2C2E35', color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: isPending ? 0.7 : 1 }}>
            {isPending ? 'Pausing…' : 'Pause Rule'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
