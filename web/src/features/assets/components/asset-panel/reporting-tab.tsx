import { useEffect, useState } from 'react'
import { useUpdateAsset } from '../../queries'
import type { AssetItem } from '../../types'
import { TabBody } from './tab-layout'

/** Reporting tab: investability classification and ownership percentage. */
export function ReportingTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const [reportInvestability, setReportInvestability] = useState(asset.investability)
  const [reportOwnershipPct, setReportOwnershipPct] = useState(String(asset.ownership_pct))
  const [reportSaved, setReportSaved] = useState(false)

  const { mutate: updateAsset, isPending: savingAsset } = useUpdateAsset(portfolioId, asset.id)

  // Flash "Saved!" on the button for 2s after a save
  useEffect(() => {
    if (!reportSaved) return
    const t = setTimeout(() => setReportSaved(false), 2000)
    return () => clearTimeout(t)
  }, [reportSaved])

  const save = () =>
    updateAsset(
      {
        ownership_pct: parseFloat(reportOwnershipPct),
        ...(asset.investability_editable ? { investability: reportInvestability } : {}),
      },
      { onSuccess: () => setReportSaved(true) },
    )

  return (
    <TabBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>

          {/* ── Asset Classification ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Asset Classification</span>
              <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px' }}>This determines whether an asset can be easily accessible as cash or not</span>
            </div>

            {([
              { value: 'cash', label: 'Investable', desc: 'Cash (Checking, Savings, Money Market)' },
              { value: 'investable', label: 'Investable', desc: 'Can be easily converted to cash (stocks, bonds, crypto, mutual funds)' },
              { value: 'non_investable', label: 'Non-Investable', desc: 'Real estate, Physical valuables, Illiquid private investments' },
            ] as { value: string; label: string; desc: string }[]).map(opt => {
              const selected = reportInvestability === opt.value
              const canToggle = asset.investability_editable
              return (
                <div
                  key={opt.value}
                  onClick={() => canToggle && setReportInvestability(opt.value)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', opacity: selected ? 1 : 0.5, cursor: canToggle ? 'pointer' : 'default' }}
                >
                  <div style={{ marginTop: '3px', width: '16px', height: '16px', flexShrink: 0, borderRadius: '100px', background: selected ? 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)' : '#FFFFFF', boxShadow: selected ? 'none' : '0px 2px 2px -1px rgba(17,29,80,0.04), 0px 4px 2px -1px rgba(17,29,80,0.04), 0px 0px 0px 0.5px rgba(17,29,80,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF' }} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px', lineHeight: '22px' }}>{opt.label}</span>
                    <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px' }}>{opt.desc}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Ownership Percentage ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#2C2E35', letterSpacing: '0.1px' }}>Ownership Percentage</span>
              <span style={{ fontSize: '12px', color: '#6E738C', lineHeight: '20px' }}>This is how much of the asset you own</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: '#EFF0F5', borderRadius: '12px', height: '40px', overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', flexShrink: 0 }}>
                <span style={{ fontSize: '14px', color: '#B3B8CB', lineHeight: '22px' }}>%</span>
              </div>
              <input
                type="number"
                value={reportOwnershipPct}
                onChange={e => setReportOwnershipPct(e.target.value)}
                min={0} max={100} step={0.01}
                placeholder="0.00"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '8px 16px 8px 0', fontSize: '14px', color: '#2C2E35', fontFamily: 'var(--font-sans)', lineHeight: '22px' }}
              />
            </div>
          </div>

          {/* ── Save button ── */}
          <div style={{ marginTop: 'auto' }}>
            <button
              type="button"
              onClick={save}
              disabled={savingAsset}
              style={{ width: '100%', height: '40px', borderRadius: '10px', border: 'none', background: reportSaved ? '#22C55E' : 'linear-gradient(180deg, #044FFA 0%, #033AB8 100%)', color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: savingAsset ? 'not-allowed' : 'pointer', opacity: savingAsset ? 0.7 : 1, transition: 'background 0.2s' }}
            >
              {savingAsset ? 'Saving…' : reportSaved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>

        </div>
    </TabBody>
  )
}
