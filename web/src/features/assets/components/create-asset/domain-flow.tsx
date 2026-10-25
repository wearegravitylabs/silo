import { useState } from 'react'
import { FormField } from '@/components/form-field'
import { MoneyInput } from '@/components/money-input'
import { parseNumber } from '@/components/number-input'
import { TwoPane } from '@/components/two-pane'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { getErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/format'
import { DOMAIN_COLORS } from '../../constants'
import { useAssetMutations } from '../../queries'
import { DomainColorDisc } from './domain-color-disc'
import { SheetFooter, SheetHeader, type FlowProps } from './sheet-chrome'
import { StepHeading } from './step-heading'
import { ValueSummary } from './value-summary'

const EMPTY = '--'

/** "https://www.x.com/" pasted in → "www.x.com/" (the field shows https:// itself). */
const stripScheme = (text: string) =>
  text
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\s/g, '')

/** A host with a dot and a 2+ letter ending ("johndoe.com", "www.johndoe.com/"). */
const isDomain = (text: string) => /^[a-z\d-]+(\.[a-z\d-]+)*\.[a-z]{2,}(\/.*)?$/i.test(text)

/** Add Domain: its colour, address and estimated price, beside the Asset Summary. Stacked on phones. */
export function DomainFlow({ portfolioId, folderId, onCreated, onClose, onBack }: FlowProps) {
  const [color, setColor] = useState<string>(DOMAIN_COLORS[0])
  const [domain, setDomain] = useState('')
  const [priceText, setPriceText] = useState('')
  const [currency, setCurrency] = useState('USD')
  const { createValued: create } = useAssetMutations(portfolioId)

  const price = parseNumber(priceText) ?? 0
  const url = domain ? `https://${domain}` : ''
  const canSubmit = isDomain(domain) && price > 0

  const submit = () =>
    create.mutate(
      { folder_id: folderId, asset_type: 'domain', name: url, value: price, currency, logo_url: null, color },
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
              <DomainColorDisc value={color} onChange={setColor} />
              <StepHeading title="Add Domain">Add domain details</StepHeading>
            </div>
            <div className="flex flex-col gap-5">
              <FormField label="Domain Address" htmlFor="domain-address" required>
                <InputGroup>
                  <InputGroupAddon className="text-muted-foreground">https://</InputGroupAddon>
                  <InputGroupInput
                    id="domain-address"
                    value={domain}
                    onChange={(e) => setDomain(stripScheme(e.target.value))}
                    placeholder="www.yourdomain.com/"
                    inputMode="url"
                    autoComplete="off"
                    className="pl-6"
                  />
                </InputGroup>
              </FormField>
              <FormField label="Estimated Price" htmlFor="domain-price" required>
                <MoneyInput
                  id="domain-price"
                  value={priceText}
                  onChange={setPriceText}
                  currency={currency}
                  onCurrencyChange={setCurrency}
                />
              </FormField>
            </div>
          </>
        }
        summary={
          <ValueSummary
            rows={[
              { label: 'Domain Address', value: url || EMPTY },
              { label: 'Estimated Price', value: formatMoney(price, currency) },
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
