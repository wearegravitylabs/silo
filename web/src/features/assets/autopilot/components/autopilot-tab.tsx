import { useState } from 'react'
import { formatCurrency, formatDate, formatDateRange } from '@/lib/format'
import { TabBody } from '../../components/asset-panel/tab-layout'
import type { AssetItem } from '../../types'
import { FREQ_LABELS } from '../constants'
import { useRules } from '../queries'
import type { AutopilotRule } from '../types'
import { AddRuleModal } from './add-rule-modal'
import { PauseRuleDialog } from './pause-rule-dialog'
import { RuleMenu } from './rule-menu'

/** Auto-Pilot tab in the asset panel: this asset's scheduled add/remove rules. */
export function AutopilotTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const [showAddRule, setShowAddRule] = useState(false)
  const [pausingRule, setPausingRule] = useState<AutopilotRule | null>(null)
  const { data: allRules } = useRules(portfolioId)
  const rules = (allRules ?? []).filter(r => r.target_id === asset.id)

  return (
    <>
      <TabBody>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {rules.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', minHeight: '240px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EFF0F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2l1.8 4 4.2.6-3 2.9.7 4.2L10 11.8l-3.7 1.9.7-4.2-3-2.9 4.2-.6L10 2z" stroke="#B3B8CB" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M3 17h14" stroke="#B3B8CB" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C2E35' }}>No Auto-Pilot Rules Added</div>
              <div style={{ fontSize: '12px', color: '#B3B8CB', textAlign: 'center', maxWidth: '220px', lineHeight: '1.5' }}>
                Create a rule to automatically add or remove this asset on a schedule.
              </div>
            </div>
          ) : (
            rules.map(rule => (
              <div key={rule.id} style={{ background: '#F9F9FB', borderRadius: '12px', padding: '12px 14px', opacity: rule.is_active ? 1 : 0.55 }}>
                {/* Date range + menu */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#B3B8CB', fontWeight: 500 }}>
                    {formatDateRange(rule.start_date, rule.end_date)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!rule.is_active && (
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#6E738C', background: '#EFF0F5', borderRadius: '4px', padding: '1px 6px' }}>Paused</span>
                    )}
                    <RuleMenu
                      rule={rule}
                      portfolioId={portfolioId}
                      onEdit={() => setShowAddRule(true)}
                      onPause={() => setPausingRule(rule)}
                    />
                  </div>
                </div>
                {/* Action + frequency */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: rule.action === 'add' ? '#008753' : '#F03722' }}>
                    {rule.action === 'add' ? 'Add' : 'Remove'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6E738C', fontWeight: 500 }}>{FREQ_LABELS[rule.frequency] ?? rule.frequency}</span>
                </div>
                {/* Amount + next execution */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: rule.action === 'add' ? '#008753' : '#F03722' }}>
                    {rule.action === 'add' ? '+' : '−'}
                    {rule.units != null
                      ? `${rule.units.toLocaleString()}${asset.ticker ? ` $${asset.ticker}` : ' units'}`
                      : formatCurrency(rule.amount, asset.currency)
                    }
                  </span>
                  {rule.next_run_at && (
                    <span style={{ fontSize: '11px', color: '#B3B8CB' }}>
                      Next Execution: {formatDate(rule.next_run_at)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Sticky Add Rule button */}
          <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
            <button type="button" onClick={() => setShowAddRule(true)}
              style={{ width: '100%', height: '40px', borderRadius: '10px', border: 'none', background: 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Add Rule
            </button>
          </div>
        </div>
      </TabBody>

        {showAddRule && (
          <AddRuleModal
            asset={asset}
            portfolioId={portfolioId}
            onClose={() => setShowAddRule(false)}
          />
        )}
        {pausingRule && (
          <PauseRuleDialog
            rule={pausingRule}
            portfolioId={portfolioId}
            onClose={() => setPausingRule(null)}
          />
        )}
    </>
  )
}
