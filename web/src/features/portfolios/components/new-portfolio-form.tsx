import { useId, useState } from 'react'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { InfoDotIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { portfolioSlug, portfolioUrl } from '../lib'
import { useCreatePortfolio } from '../queries'
import type { Portfolio } from '../types'
import { AvatarPicker, avatarImageUrl, type AvatarId } from './avatar-picker'
import { CurrencyField } from './currency-field'

/** Settings → Create a portfolio: avatar card, name, base currency, its link (from the name), Create Portfolio. */
export function NewPortfolioForm({
  defaultCurrency = 'USD',
  onCreated,
}: {
  defaultCurrency?: string
  onCreated: (portfolio: Portfolio) => void
}) {
  const [avatar, setAvatar] = useState<AvatarId>('lime')
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState(defaultCurrency)
  const create = useCreatePortfolio()
  const id = useId()
  const ready = !!name.trim()

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!ready || create.isPending) return
    create.mutate(
      { name: name.trim(), base_currency: currency, image_url: avatarImageUrl(avatar) },
      {
        onSuccess: (portfolio) => {
          toast.success('Portfolio has been created successfully!')
          onCreated(portfolio)
        },
        onError: () => toast.error('Couldn’t create the portfolio. Try again.'),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <AvatarPicker selected={avatar} onChange={setAvatar} />

      <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
        <FormField label="Portfolio Name" htmlFor={`${id}-name`}>
          <Input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter portfolio name" />
        </FormField>

        <FormField
          label="Base Currency"
          htmlFor={`${id}-currency`}
          hint={
            <p className="flex items-center gap-1 text-xs leading-5 text-muted-foreground">
              <InfoDotIcon />
              This is the currency you mostly operate with
            </p>
          }
        >
          <CurrencyField id={`${id}-currency`} value={currency} onChange={setCurrency} />
        </FormField>

        <FormField label="Portfolio URL" htmlFor={`${id}-url`}>
          <Input
            id={`${id}-url`}
            value={portfolioSlug(name) ? portfolioUrl(name) : ''}
            placeholder="https://"
            readOnly
            className="cursor-default text-muted-foreground placeholder:text-muted-foreground"
          />
        </FormField>

        <Button type="submit" size="lg" disabled={!ready} loading={create.isPending} loadingText="Creating…" className="mt-6 w-full">
          Create Portfolio
        </Button>
      </form>
    </div>
  )
}
