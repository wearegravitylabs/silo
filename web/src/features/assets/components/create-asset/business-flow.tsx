import { useState } from 'react'
import { FormField } from '@/components/form-field'
import { MoneyInput } from '@/components/money-input'
import { parseNumber } from '@/components/number-input'
import { PercentInput } from '@/components/percent-input'
import { TwoPane } from '@/components/two-pane'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/format'
import { BUSINESS_TYPES, SOLE_OWNER_TYPE } from '../../constants'
import { useAssetMutations } from '../../queries'
import { ImageUploadDisc } from './image-upload-disc'
import { SheetFooter, SheetHeader, type FlowProps } from './sheet-chrome'
import { StepHeading } from './step-heading'
import { ValueSummary } from './value-summary'

const EMPTY = '--'

/**
 * Add Business: name, type, its estimated value and — for anything but a sole proprietorship, once the type's picked —
 * your ownership share; the asset counts your share of the value. Stacked on phones.
 */
export function BusinessFlow({ portfolioId, folderId, onCreated, onClose, onBack }: FlowProps) {
  const [image, setImage] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [valueText, setValueText] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [ownershipText, setOwnershipText] = useState('')
  const { createValued: create } = useAssetMutations(portfolioId)

  const value = parseNumber(valueText) ?? 0
  const asksShare = type !== '' && type !== SOLE_OWNER_TYPE
  const ownership = asksShare ? parseNumber(ownershipText) : 100
  const ownershipValid = ownership !== null && ownership > 0 && ownership <= 100
  const ownershipError = asksShare && ownershipText.trim() !== '' && !ownershipValid ? 'Enter a share between 0 and 100%' : undefined
  const canSubmit = name.trim() !== '' && type !== '' && value > 0 && ownershipValid

  const submit = () =>
    create.mutate(
      {
        folder_id: folderId,
        asset_type: 'business',
        name: name.trim(),
        value: (value * (ownership ?? 100)) / 100,
        currency,
        logo_url: image,
        status: type,
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
              <StepHeading title="Add Business">
                Track startup investments and VC fund positions. Perfect for angel investors and those with stakes in private companies.
              </StepHeading>
            </div>
            <div className="flex flex-col gap-5">
              <FormField label="Name" htmlFor="business-name" required>
                <Input
                  id="business-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter business name"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Business Type" htmlFor="business-type" required>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="business-type">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Estimated Value" htmlFor="business-value" required>
                <MoneyInput
                  id="business-value"
                  value={valueText}
                  onChange={setValueText}
                  currency={currency}
                  onCurrencyChange={setCurrency}
                />
              </FormField>
              {asksShare && (
                <FormField label="Ownership Percentage" htmlFor="business-share" required error={ownershipError} className="animate-rise">
                  <PercentInput id="business-share" value={ownershipText} onChange={setOwnershipText} invalid={!!ownershipError} />
                </FormField>
              )}
            </div>
          </>
        }
        summary={
          <ValueSummary
            rows={[
              { label: 'Name', value: name.trim() || EMPTY },
              { label: 'Business Type', value: type || EMPTY },
              { label: 'Estimated Value', value: formatMoney(value, currency) },
              ...(asksShare
                ? [{ label: 'Ownership Percentage', value: ownershipValid ? `${Number(ownership!.toFixed(2))}%` : EMPTY }]
                : []),
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
