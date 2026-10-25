import { ChevronDownIcon } from 'lucide-react'
import { MoneyInput } from '@/components/money-input'
import { NumberInput } from '@/components/number-input'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'
import { SegmentedTabs, SegmentedTabsList, SegmentedTabsTrigger } from '@/components/ui/segmented-tabs'
import type { AssetItem } from '../../types'
import { AssetIconDisc } from '../asset-icon-disc'

/** Whether an asset is counted in units (it has a ticker and a quantity) rather than money. */
export const countsUnits = (asset: AssetItem) => asset.total_quantity != null && !!asset.ticker

/** Add | Remove segmented control (Add History, Auto-Pilot rules). */
export function AddRemoveToggle({ value, onChange }: { value: 'add' | 'remove'; onChange: (value: 'add' | 'remove') => void }) {
  return (
    <SegmentedTabs value={value} onValueChange={(v) => onChange(v as 'add' | 'remove')}>
      <SegmentedTabsList aria-label="Add or remove">
        <SegmentedTabsTrigger value="add">Add</SegmentedTabsTrigger>
        <SegmentedTabsTrigger value="remove">Remove</SegmentedTabsTrigger>
      </SegmentedTabsList>
    </SegmentedTabs>
  )
}

/** Units of a ticker asset (its logo and ticker in front: "MSFT ⌄ 100"), or money for the rest. */
export function AssetAmountInput({
  id,
  asset,
  value,
  onChange,
  invalid,
  placeholder,
}: {
  id: string
  asset: AssetItem
  value: string
  onChange: (text: string) => void
  invalid?: boolean
  placeholder?: string
}) {
  if (!countsUnits(asset))
    return (
      <MoneyInput
        id={id}
        value={value}
        onChange={onChange}
        currency={asset.converted_currency}
        invalid={invalid}
        placeholder={placeholder}
      />
    )
  return (
    <InputGroup invalid={invalid}>
      <InputGroupAddon className="gap-1.5 pl-4">
        <AssetIconDisc asset={asset} className="size-4 border-0" />
        <span>{asset.ticker}</span>
        <ChevronDownIcon className="size-2.5 text-muted-foreground" aria-hidden />
      </InputGroupAddon>
      <NumberInput id={id} value={value} onChange={onChange} decimals={8} pad={false} invalid={invalid} placeholder={placeholder} />
    </InputGroup>
  )
}
