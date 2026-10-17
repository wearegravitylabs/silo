import { useState } from 'react'
import { toast } from 'sonner'
import { toastDone } from '@/components/ui/sonner'
import { downloadUrl } from '@/lib/download'
import { useEndTrial, useInvoicePdf, useInvoices, usePayInvoice, useSubscription } from '../queries'
import type { Invoice } from '../types'
import { CurrentPlanCard } from './current-plan-card'
import { EndTrialDialog } from './end-trial-dialog'
import { InvoicePanel } from './invoice-panel'
import { InvoicesTable } from './invoices-table'
import { PlanUpgradeModal } from './plan-upgrade-modal'

/**
 * Body of Settings → Billing (inside a wide <SettingsPage>): the current plan, the invoices table, and their
 * dialogs — End Trial, Upgrade / Manage Plan, an invoice's panel (pay or download it).
 */
export function BillingSettings() {
  const { data: subscription } = useSubscription()
  const { data: invoices = [], isPending: loadingInvoices } = useInvoices()
  const endTrial = useEndTrial()
  const pay = usePayInvoice()
  const pdf = useInvoicePdf()
  const [dialog, setDialog] = useState<'end-trial' | 'upgrade' | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  // Fresh from the list, so paying updates the open panel; kept while the panel animates closed.
  const invoice = invoices.find((i) => i.id === openId) ?? null

  const confirmEndTrial = () =>
    endTrial.mutate(undefined, {
      onSuccess: () => {
        setDialog(null)
        toastDone('Free plan has been cancelled successfully')
      },
      onError: () => toast.error('Couldn’t end your trial. Try again.'),
    })

  const payInvoice = (i: Invoice) =>
    pay.mutate(i.id, {
      onSuccess: () => toast.success('Invoice paid successfully'),
      onError: () => toast.error('Couldn’t pay this invoice. Try again.'),
    })

  const download = (i: Invoice) =>
    pdf.mutate(i.id, {
      onSuccess: (blob) => downloadUrl(URL.createObjectURL(blob), `silo-invoice-${i.number}.pdf`),
      onError: () => toast.error('Couldn’t download this invoice. Try again.'),
    })

  return (
    <>
      {subscription && (
        <CurrentPlanCard
          subscription={subscription}
          onEndTrial={() => setDialog('end-trial')}
          onUpgrade={() => setDialog('upgrade')}
          className="mb-6"
        />
      )}

      <InvoicesTable
        invoices={invoices}
        loading={loadingInvoices}
        onOpen={(i) => {
          setOpenId(i.id)
          setPanelOpen(true)
        }}
      />

      <InvoicePanel
        invoice={invoice}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        paying={pay.isPending}
        downloading={pdf.isPending}
        onPay={payInvoice}
        onDownload={download}
      />
      <EndTrialDialog
        open={dialog === 'end-trial'}
        onOpenChange={(open) => !open && setDialog(null)}
        trialDays={subscription?.trial_days ?? 7}
        pending={endTrial.isPending}
        onConfirm={confirmEndTrial}
      />
      <PlanUpgradeModal open={dialog === 'upgrade'} onOpenChange={(open) => !open && setDialog(null)} />
    </>
  )
}
