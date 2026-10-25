import { useState } from 'react'
import { ChoiceCard } from '@/components/choice-card'
import { DateField, todayIso } from '@/components/date-field'
import { FormField } from '@/components/form-field'
import { MoneyInput } from '@/components/money-input'
import { parseNumber } from '@/components/number-input'
import { SearchInput } from '@/components/search-input'
import { TwoPane } from '@/components/two-pane'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/api-client'
import { formatDayMonthTime, formatMoney } from '@/lib/format'
import { PHYSICAL_KINDS, type PhysicalKind } from '../../constants'
import { useAssetMutations } from '../../queries'
import { ImageUploadDisc } from './image-upload-disc'
import { SheetFooter, SheetHeader, StepBody, type FlowProps } from './sheet-chrome'
import { StepHeading } from './step-heading'
import { ValueChange } from './value-change'
import { ValueSummary } from './value-summary'

const EMPTY = '--'

/** "2018-04-03" → "03 Apr 2018" */
const dayMonthYear = (day: string) => `${formatDayMonthTime(day).split(' ').slice(0, 2).join(' ')} ${day.slice(0, 4)}`

/** Physical Valuables: pick what kind (vehicle, gold, art…), then its details beside the Asset Summary. */
export function PhysicalFlow(props: FlowProps) {
  const [kind, setKind] = useState<PhysicalKind | null>(null)
  const [step, setStep] = useState<'kind' | 'details'>('kind')
  const [search, setSearch] = useState('')

  if (step === 'details' && kind) return <PhysicalDetails key={kind.id} kind={kind} {...props} onBack={() => setStep('kind')} />

  const q = search.trim().toLowerCase()
  const kinds = PHYSICAL_KINDS.filter((k) => !q || k.label.toLowerCase().includes(q))

  return (
    <>
      <SheetHeader progress={0.5} />
      <StepBody>
        <div className="flex w-full max-w-100 flex-col gap-8">
          <StepHeading title="Select Physical Valuables">
            Track physical assets such as gold, jewellery, art, watches, and vehicles
          </StepHeading>
          <SearchInput
            value={search}
            onChange={setSearch}
            label="Search physical valuables"
            placeholder="Search.."
            autoFocus
            className="w-full bg-accent"
          />
          <div role="radiogroup" aria-label="Physical valuables" className="flex flex-col gap-4">
            {kinds.map((k) => (
              <ChoiceCard
                key={k.id}
                size="sm"
                label={k.label}
                icon={<k.Icon className="size-3.5 text-primary-dark" aria-hidden />}
                selected={k.id === kind?.id}
                onSelect={() => setKind(k)}
                check={false}
              />
            ))}
            {kinds.length === 0 && <p className="py-6 text-center text-muted-foreground">Nothing matches “{search.trim()}”</p>}
          </div>
        </div>
      </StepBody>
      <SheetFooter back={{ label: 'Back', onClick: props.onBack }} next={{ onClick: () => setStep('details'), disabled: !kind }} />
    </>
  )
}

/** "Add Vehicle": image, name, current value, when and for how much it was bought. */
function PhysicalDetails({ kind, portfolioId, folderId, onCreated, onClose, onBack }: FlowProps & { kind: PhysicalKind }) {
  const [image, setImage] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [valueText, setValueText] = useState('')
  const [valueCurrency, setValueCurrency] = useState('USD')
  const [acquiredOn, setAcquiredOn] = useState('')
  const [priceText, setPriceText] = useState('')
  const [priceCurrency, setPriceCurrency] = useState('USD')
  const { createValued: create } = useAssetMutations(portfolioId)

  const lower = kind.singular.toLowerCase()
  const value = parseNumber(valueText) ?? 0
  const price = parseNumber(priceText) ?? 0
  const canSubmit = name.trim() !== '' && value > 0 && acquiredOn !== '' && price > 0
  // How the value moved since it was bought, when both are in the same currency.
  const changePct = value > 0 && price > 0 && valueCurrency === priceCurrency ? ((value - price) / price) * 100 : null

  const submit = () =>
    create.mutate(
      {
        folder_id: folderId,
        asset_type: 'physical',
        subtype: kind.id,
        name: name.trim(),
        value,
        currency: valueCurrency,
        logo_url: image,
        acquisition: { date: acquiredOn, price, currency: priceCurrency },
      },
      {
        onSuccess: (asset) => {
          onCreated?.(asset)
          onClose()
        },
      },
    )

  return (
    <>
      <SheetHeader progress={1} />
      <TwoPane
        form={
          <>
            <div className="flex flex-col items-center gap-4">
              <ImageUploadDisc value={image} onChange={setImage} />
              <StepHeading title={`Add ${kind.singular}`}>Add {lower} details</StepHeading>
            </div>
            <div className="flex flex-col gap-5">
              <FormField label="Name" htmlFor="physical-name" required>
                <Input
                  id="physical-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`Enter ${lower} name`}
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Current Value" htmlFor="physical-value" required>
                <MoneyInput
                  id="physical-value"
                  value={valueText}
                  onChange={setValueText}
                  currency={valueCurrency}
                  onCurrencyChange={setValueCurrency}
                />
              </FormField>
              <FormField label="Acquisition Date" htmlFor="physical-date" required>
                <DateField id="physical-date" value={acquiredOn} onChange={setAcquiredOn} max={todayIso()} />
              </FormField>
              <FormField label="Acquisition Price" htmlFor="physical-price" required>
                <MoneyInput
                  id="physical-price"
                  value={priceText}
                  onChange={setPriceText}
                  currency={priceCurrency}
                  onCurrencyChange={setPriceCurrency}
                />
              </FormField>
            </div>
          </>
        }
        summary={
          <ValueSummary
            rows={[
              { label: `${kind.singular} Name`, value: name.trim() || EMPTY },
              { label: 'Acquisition Price', value: formatMoney(price, priceCurrency) },
              {
                label: 'Acquisition Date',
                value: acquiredOn ? dayMonthYear(acquiredOn) : formatDayMonthTime(`${todayIso()}T00:00`),
              },
              {
                label: 'Current Value',
                value: (
                  <span className="flex items-center gap-2">
                    {changePct !== null && changePct !== 0 && <ValueChange pct={changePct} />}
                    {formatMoney(value, valueCurrency)}
                  </span>
                ),
              },
            ]}
            canSubmit={canSubmit}
            creating={create.isPending}
            error={create.error ? getErrorMessage(create.error, 'Couldn’t create the asset. Try again.') : undefined}
            onCreate={submit}
          />
        }
      />
      <SheetFooter back={{ label: 'Back', onClick: onBack }} />
    </>
  )
}
