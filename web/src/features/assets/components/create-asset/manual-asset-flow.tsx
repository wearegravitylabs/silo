import { useState } from 'react'
import { FormField } from '@/components/form-field'
import { InfoDotIcon } from '@/components/icons'
import { MoneyInput } from '@/components/money-input'
import { parseNumber } from '@/components/number-input'
import { TwoPane } from '@/components/two-pane'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/format'
import { useAssetMutations } from '../../queries'
import { ImageUploadDisc } from './image-upload-disc'
import { SheetFooter, SheetHeader, type FlowProps } from './sheet-chrome'
import { StepHeading } from './step-heading'
import { ValueSummary } from './value-summary'

const EMPTY = '--'

/** Add Manual Asset: anything else — you name it, say what kind it is, and value it. Stacked on phones. */
export function ManualAssetFlow({ portfolioId, folderId, onCreated, onClose, onBack }: FlowProps) {
  const [image, setImage] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [kind, setKind] = useState('')
  const [valueText, setValueText] = useState('')
  const [currency, setCurrency] = useState('USD')
  const { createValued: create } = useAssetMutations(portfolioId)

  const value = parseNumber(valueText) ?? 0
  const canSubmit = name.trim() !== '' && kind.trim() !== '' && value > 0

  const submit = () =>
    create.mutate(
      { folder_id: folderId, asset_type: 'manual', name: name.trim(), value, currency, logo_url: image, status: kind.trim() },
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
              <StepHeading title="Add Manual Asset">
                For anything else—domains, loans you’ve given, IP, or unique assets. You name it, value it, and track it.
              </StepHeading>
            </div>
            <div className="flex flex-col gap-5">
              <FormField label="Name" htmlFor="manual-asset-name" required>
                <Input
                  id="manual-asset-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter asset name"
                  autoComplete="off"
                />
              </FormField>
              <FormField
                label="Asset Type"
                htmlFor="manual-asset-type"
                required
                hint={
                  <p className="flex items-center gap-1 text-xs leading-5 text-muted-foreground">
                    <InfoDotIcon />
                    Could be loans, domains, IP etc.
                  </p>
                }
              >
                <Input
                  id="manual-asset-type"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  placeholder="Enter asset type"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Value" htmlFor="manual-asset-value" required>
                <MoneyInput
                  id="manual-asset-value"
                  value={valueText}
                  onChange={setValueText}
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
              { label: 'Name', value: name.trim() || EMPTY },
              { label: 'Asset Type', value: kind.trim() || EMPTY },
              { label: 'Estimated Value', value: formatMoney(value, currency) },
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
