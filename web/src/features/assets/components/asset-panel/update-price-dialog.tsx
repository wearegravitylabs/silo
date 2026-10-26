import { useState } from 'react'
import { toast } from 'sonner'
import { Callout } from '@/components/callout'
import { DateField, todayIso } from '@/components/date-field'
import { FormField } from '@/components/form-field'
import { parseNumber } from '@/components/number-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/format'
import { useUpdateAssetPrice } from '../../panel-queries'
import type { AssetItem } from '../../types'
import { AssetAmountInput } from './amount-fields'

/** Update Price: a new value on a date, for an asset valued in money (real estate, a domain, …). Resets each time it opens. */
export function UpdatePriceDialog({
  asset,
  portfolioId,
  open,
  onOpenChange,
}: {
  asset: AssetItem
  portfolioId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        {open && <PriceForm asset={asset} portfolioId={portfolioId} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function PriceForm({ asset, portfolioId, onDone }: { asset: AssetItem; portfolioId: string; onDone: () => void }) {
  const [text, setText] = useState('')
  const [date, setDate] = useState(todayIso)
  const { mutate, isPending, error } = useUpdateAssetPrice(portfolioId, asset.id)
  const value = parseNumber(text)
  const valid = value !== null && value > 0 && !!date

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!valid) return
    mutate(
      { value: value!, date },
      {
        onSuccess: () => {
          onDone()
          toast.success('Price has been updated successfully!')
        },
      },
    )
  }

  return (
    <form onSubmit={submit} className="contents" noValidate>
      <DialogHeader>
        <DialogTitle className="font-sans">Update Price</DialogTitle>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <Callout variant="notice" title={`Current Price: ${formatMoney(asset.owned_value_converted, asset.converted_currency)}`} />
        <FormField
          label="Amount"
          htmlFor="price-amount"
          required
          error={error ? getErrorMessage(error, 'Couldn’t update the price. Try again.') : undefined}
        >
          <AssetAmountInput id="price-amount" asset={asset} value={text} onChange={setText} invalid={!!error} />
        </FormField>
        <FormField label="Date" htmlFor="price-date" required>
          <DateField id="price-date" value={date} onChange={setDate} />
        </FormField>
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" size="xs">
            Close
          </Button>
        </DialogClose>
        <Button type="submit" size="xs" disabled={!valid} loading={isPending} loadingText="Updating…">
          Update Price
        </Button>
      </DialogFooter>
    </form>
  )
}
