import { useState } from 'react'
import { FormField } from '@/components/form-field'
import { MoneyInput } from '@/components/money-input'
import { parseNumber } from '@/components/number-input'
import { TwoPane } from '@/components/two-pane'
import { getErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/format'
import { useAssetMutations } from '../../queries'
import { AddressField } from './address-field'
import { ImageUploadDisc } from './image-upload-disc'
import { PictureDropzone } from './picture-dropzone'
import { SheetFooter, SheetHeader, type FlowProps } from './sheet-chrome'
import { StepHeading } from './step-heading'
import { ValueSummary } from './value-summary'

const EMPTY = '--'

/**
 * Add Real Estate: a cover image (the first photo until one's picked), the address (Google Places), its estimated
 * price and up to 4 photos, beside the Asset Summary. Stacked on phones.
 */
export function RealEstateFlow({ portfolioId, folderId, onCreated, onClose, onBack }: FlowProps) {
  const [image, setImage] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [priceText, setPriceText] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [pictures, setPictures] = useState<string[]>([])
  const { createValued: create } = useAssetMutations(portfolioId)

  const price = parseNumber(priceText) ?? 0
  const canSubmit = address !== '' && price > 0

  const submit = () =>
    create.mutate(
      {
        folder_id: folderId,
        asset_type: 'real_estate',
        name: address,
        value: price,
        currency,
        logo_url: image ?? pictures[0] ?? null,
        pictures,
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
              <ImageUploadDisc value={image} onChange={setImage} fallback={pictures[0]} />
              <StepHeading title="Add Real Estate">
                Add your house, rental properties, or land. We’ll track the value over time, and you can update it whenever you get a new
                appraisal.
              </StepHeading>
            </div>
            <div className="flex flex-col gap-5">
              <FormField label="Address" htmlFor="estate-address" required>
                <AddressField id="estate-address" value={address} onChange={setAddress} placeholder="Enter real estate address" />
              </FormField>
              <FormField label="Estimated Price" htmlFor="estate-price" required>
                <MoneyInput
                  id="estate-price"
                  value={priceText}
                  onChange={setPriceText}
                  currency={currency}
                  onCurrencyChange={setCurrency}
                />
              </FormField>
              <FormField
                label={
                  <>
                    Pictures <span className="font-normal text-subtle">(optional)</span>
                  </>
                }
                htmlFor="estate-pictures"
              >
                <PictureDropzone id="estate-pictures" pictures={pictures} onChange={setPictures} />
              </FormField>
            </div>
          </>
        }
        summary={
          <ValueSummary
            rows={[
              { label: 'Address', value: address || EMPTY },
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
