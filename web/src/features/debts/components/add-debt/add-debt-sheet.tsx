import { TwoPane } from '@/components/two-pane'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SheetContent } from '@/components/ui/sheet'
import { useCreateDebt } from '../../queries'
import { AddDebtForm } from './add-debt-form'
import { DebtSummary } from './debt-summary'
import { useAddDebtForm } from './use-add-debt-form'

interface Props {
  portfolioId: string
  /** Folder the new debt goes into (the selected tab). */
  folderId: string | null
  /** Currency the balance starts in. */
  defaultCurrency?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** After the debt is saved (e.g. to show a toast). The sheet closes itself. */
  onAdded?: () => void
}

/** Full-height Add Debt sheet: form on the left, live summary on the right (stacked on phones). */
export function AddDebtSheet({ open, onOpenChange, ...props }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined}>
        <DialogHeader className="px-4 md:px-5">
          <DialogTitle>Add Debt</DialogTitle>
        </DialogHeader>
        {/* Mounted only while open, so every open starts blank */}
        <AddDebtBody {...props} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Dialog>
  )
}

function AddDebtBody({
  portfolioId,
  folderId,
  defaultCurrency = 'USD',
  onAdded,
  onClose,
}: Omit<Props, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const form = useAddDebtForm(defaultCurrency)
  const { mutate: create, isPending } = useCreateDebt(portfolioId)

  const submit = () =>
    create(form.toInput(folderId), {
      onSuccess: () => {
        onAdded?.()
        onClose()
      },
    })

  return (
    <>
      <TwoPane form={<AddDebtForm form={form} />} summary={<DebtSummary form={form} submitting={isPending} onSubmit={submit} />} />
      <div className="flex h-15 shrink-0 items-center border-t border-border px-4 md:px-5">
        <Button variant="secondary" size="xs" onClick={onClose} className="px-3">
          Close
        </Button>
      </div>
    </>
  )
}
