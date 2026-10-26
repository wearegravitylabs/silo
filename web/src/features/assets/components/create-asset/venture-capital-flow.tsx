import { useState } from 'react'
import { FormField } from '@/components/form-field'
import { MoneyInput } from '@/components/money-input'
import { parseNumber } from '@/components/number-input'
import { TwoPane } from '@/components/two-pane'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/format'
import { INVESTMENT_STAGES } from '../../constants'
import { useAssetMutations } from '../../queries'
import { ImageUploadDisc } from './image-upload-disc'
import { SheetFooter, SheetHeader, type FlowProps } from './sheet-chrome'
import { StepHeading } from './step-heading'
import { ValueChange } from './value-change'
import { ValueSummary } from './value-summary'

const EMPTY = '--'

/**
 * Add Venture Capital: a startup or fund stake — name, stage, what went in, what's come back, what it's worth now —
 * beside the Asset Summary. Stacked on phones.
 */
export function VentureCapitalFlow({ portfolioId, folderId, onCreated, onClose, onBack }: FlowProps) {
  const [image, setImage] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [stage, setStage] = useState('')
  const [investedText, setInvestedText] = useState('')
  const [investedCurrency, setInvestedCurrency] = useState('USD')
  const [returnedText, setReturnedText] = useState('')
  const [returnedCurrency, setReturnedCurrency] = useState('USD')
  const [valueText, setValueText] = useState('')
  const [valueCurrency, setValueCurrency] = useState('USD')
  const { createValued: create } = useAssetMutations(portfolioId)

  const invested = parseNumber(investedText) ?? 0
  const returned = parseNumber(returnedText) ?? 0
  const value = parseNumber(valueText) ?? 0
  // Nothing back yet is a valid answer, so Total Returned only needs filling in.
  const canSubmit = name.trim() !== '' && stage !== '' && invested > 0 && returnedText.trim() !== '' && value > 0
  // Total return on what went in (still held + paid out), when all three are in one currency.
  const sameCurrency = investedCurrency === returnedCurrency && returnedCurrency === valueCurrency
  const changePct = sameCurrency && invested > 0 && value > 0 ? ((value + returned - invested) / invested) * 100 : null

  const submit = () =>
    create.mutate(
      {
        folder_id: folderId,
        asset_type: 'venture_capital',
        name: name.trim(),
        value,
        currency: valueCurrency,
        logo_url: image,
        detail: stage,
        status: 'Active',
        investable: true,
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
              <StepHeading title="Add Venture Capital">
                Track startup investments and VC fund positions. Perfect for angel investors and those with stakes in private companies.
              </StepHeading>
            </div>
            <div className="flex flex-col gap-5">
              <FormField label="Name" htmlFor="vc-name" required>
                <Input
                  id="vc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter company/fund name"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Investment Stage" htmlFor="vc-stage" required>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger id="vc-stage">
                    <SelectValue placeholder="Select investment stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Total Invested" htmlFor="vc-invested" required>
                <MoneyInput
                  id="vc-invested"
                  value={investedText}
                  onChange={setInvestedText}
                  currency={investedCurrency}
                  onCurrencyChange={setInvestedCurrency}
                />
              </FormField>
              <FormField label="Total Returned" htmlFor="vc-returned" required>
                <MoneyInput
                  id="vc-returned"
                  value={returnedText}
                  onChange={setReturnedText}
                  currency={returnedCurrency}
                  onCurrencyChange={setReturnedCurrency}
                />
              </FormField>
              <FormField label="Current Estimated Value" htmlFor="vc-value" required>
                <MoneyInput
                  id="vc-value"
                  value={valueText}
                  onChange={setValueText}
                  currency={valueCurrency}
                  onCurrencyChange={setValueCurrency}
                />
              </FormField>
            </div>
          </>
        }
        summary={
          <ValueSummary
            rows={[
              { label: 'Name', value: name.trim() || EMPTY },
              ...(stage ? [{ label: 'Investment Stage', value: stage }] : []),
              { label: 'Total Invested', value: formatMoney(invested, investedCurrency) },
              { label: 'Total Returned', value: formatMoney(returned, returnedCurrency) },
              {
                label: 'Current Estimated Value',
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
