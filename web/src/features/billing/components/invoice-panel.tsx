import { DownloadIcon, FeatherIcon } from 'lucide-react'
import { CloseIcon } from '@/components/icons'
import { Property, PropertyList } from '@/components/panel-layout'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogTitle } from '@/components/ui/dialog'
import { SheetContent } from '@/components/ui/sheet'
import { formatDayMonthYear, formatMoney } from '@/lib/format'
import { canPay, INVOICE_STATUS, invoiceStatus } from '../lib'
import type { Invoice } from '../types'

/**
 * Right-hand panel for one invoice: its details, then Download PDF once paid, or Pay Invoice from its due date on
 * (an upcoming invoice due later shows no action).
 */
export function InvoicePanel({
  invoice,
  open,
  onOpenChange,
  paying,
  downloading,
  onPay,
  onDownload,
}: {
  invoice: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  paying?: boolean
  downloading?: boolean
  onPay: (invoice: Invoice) => void
  onDownload: (invoice: Invoice) => void
}) {
  const date = (day: string) => formatDayMonthYear(day, { comma: true })
  const status = invoice && INVOICE_STATUS[invoiceStatus(invoice)]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" aria-describedby={undefined}>
        <div className="flex h-16 shrink-0 items-center px-4 sm:px-6">
          <DialogClose
            aria-label="Close panel"
            className="-ml-1 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <CloseIcon />
          </DialogClose>
        </div>

        {invoice && status && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3 pb-6 sm:px-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-primary-subtle text-primary-dark">
              <FeatherIcon className="size-4" aria-hidden />
            </span>
            <DialogTitle className="mt-4 mb-4 font-heading text-2xl leading-8 font-bold">{invoice.plan_name}</DialogTitle>
            <PropertyList>
              <Property label="Due Date">{date(invoice.due_date)}</Property>
              <Property label="Invoice Number">{invoice.number}</Property>
              <Property label="Status">
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              </Property>
              {invoice.payment_method && <Property label="Payment Method">{invoice.payment_method}</Property>}
              <Property label="Amount">{formatMoney(invoice.amount, invoice.currency, { decimals: 0 })}</Property>
              {invoice.paid_at && <Property label="Payment Date">{date(invoice.paid_at)}</Property>}
            </PropertyList>

            {invoice.paid_at ? (
              <Button
                variant="secondary"
                className="mt-6 w-full"
                loading={downloading}
                loadingText="Preparing…"
                onClick={() => onDownload(invoice)}
              >
                <DownloadIcon className="size-3.5" />
                Download PDF
              </Button>
            ) : (
              canPay(invoice) && (
                <Button className="mt-6 w-full" loading={paying} loadingText="Paying…" onClick={() => onPay(invoice)}>
                  Pay Invoice
                </Button>
              )
            )}
          </div>
        )}
      </SheetContent>
    </Dialog>
  )
}
