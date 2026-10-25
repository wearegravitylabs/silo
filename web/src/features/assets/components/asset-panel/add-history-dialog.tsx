import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { toast } from 'sonner'
import { DateField, todayIso } from '@/components/date-field'
import { FormField } from '@/components/form-field'
import { MoneyInput } from '@/components/money-input'
import { NumberInput, parseNumber } from '@/components/number-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'
import { SegmentedTabs, SegmentedTabsList, SegmentedTabsTrigger } from '@/components/ui/segmented-tabs'
import { getErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/format'
import { useAddAssetHistory } from '../../panel-queries'
import type { AssetItem } from '../../types'
import { AssetIconDisc } from '../asset-icon-disc'

/**
 * Add History: add or remove units (ticker assets) or an amount (the rest) on a date. Removing can't go past what's
 * held. The form resets each time it opens.
 */
export function AddHistoryDialog({
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
        {open && <HistoryForm asset={asset} portfolioId={portfolioId} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function HistoryForm({ asset, portfolioId, onDone }: { asset: AssetItem; portfolioId: string; onDone: () => void }) {
  const [kind, setKind] = useState<'add' | 'remove'>('add')
  const [text, setText] = useState('')
  const [date, setDate] = useState(todayIso)
  const { mutate, isPending, error } = useAddAssetHistory(portfolioId, asset.id)
  const ticker = asset.total_quantity != null && asset.ticker
  const held = ticker ? asset.total_quantity! : asset.owned_value_converted
  const value = parseNumber(text)
  const tooMuch = kind === 'remove' && value !== null && value > held
  const valid = value !== null && value > 0 && !!date && !tooMuch
  const fieldError = tooMuch
    ? `You only hold ${ticker ? `${held.toLocaleString('en-US')} ${asset.ticker}` : formatMoney(held, asset.converted_currency)}`
    : error
      ? getErrorMessage(error, 'Couldn’t add this. Try again.')
      : undefined

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!valid) return
    mutate(
      { kind, value: value!, date },
      {
        onSuccess: () => {
          onDone()
          toast.success('History has been added successfully!')
        },
      },
    )
  }

  return (
    <form onSubmit={submit} className="contents" noValidate>
      <DialogHeader>
        <DialogTitle className="font-sans">Add History</DialogTitle>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <SegmentedTabs value={kind} onValueChange={(v) => setKind(v as 'add' | 'remove')}>
          <SegmentedTabsList aria-label="Add or remove">
            <SegmentedTabsTrigger value="add">Add</SegmentedTabsTrigger>
            <SegmentedTabsTrigger value="remove">Remove</SegmentedTabsTrigger>
          </SegmentedTabsList>
        </SegmentedTabs>
        <FormField label="Amount" htmlFor="history-amount" required error={fieldError}>
          {ticker ? (
            <InputGroup invalid={!!fieldError}>
              <InputGroupAddon className="gap-1.5 pl-4">
                <AssetIconDisc asset={asset} className="size-4 border-0" />
                <span>{asset.ticker}</span>
                <ChevronDownIcon className="size-2.5 text-muted-foreground" aria-hidden />
              </InputGroupAddon>
              <NumberInput id="history-amount" value={text} onChange={setText} decimals={8} pad={false} invalid={!!fieldError} />
            </InputGroup>
          ) : (
            <MoneyInput id="history-amount" value={text} onChange={setText} currency={asset.converted_currency} invalid={!!fieldError} />
          )}
        </FormField>
        <FormField label="Acquisition Date" htmlFor="history-date" required>
          <DateField id="history-date" value={date} onChange={setDate} />
        </FormField>
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" size="xs">
            Close
          </Button>
        </DialogClose>
        <Button type="submit" size="xs" disabled={!valid} loading={isPending} loadingText="Adding…">
          Add History
        </Button>
      </DialogFooter>
    </form>
  )
}
