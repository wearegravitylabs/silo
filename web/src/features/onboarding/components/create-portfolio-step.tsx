import { useState } from 'react'
import { FieldError } from '@/components/field-error'
import { FormField, FormHeading } from '@/components/form-field'
import { ChevronDownIcon } from '@/components/icons'
import { SearchList } from '@/components/search-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { AvatarPicker, avatarImageUrl, useCreatePortfolio, useCurrencies, type AvatarId, type Portfolio } from '@/features/portfolios'

/** New-portfolio form (avatar, name, base currency, description). Calls onCreated with the new portfolio. */
export function CreatePortfolioStep({ onCreated }: { onCreated: (portfolio: Portfolio) => void }) {
  const [avatar, setAvatar] = useState<AvatarId>('lime')
  const [name, setName] = useState('')
  const [pickedCurrency, setCurrency] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { mutate, isPending, error } = useCreatePortfolio()

  const nameError = submitted && !name.trim() ? 'Enter a portfolio name' : undefined
  const currency = pickedCurrency ?? 'USD'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!name.trim()) return
    mutate(
      { name: name.trim(), base_currency: currency, description: description.trim() || undefined, image_url: avatarImageUrl(avatar) },
      { onSuccess: onCreated },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <FormHeading title="Create a new portfolio" subtitle="Your portfolio is where you track specific assets, debts and insights" />

      <AvatarPicker selected={avatar} onChange={setAvatar} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label="Portfolio Name" htmlFor="portfolio-name" error={nameError}>
          <Input
            id="portfolio-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My wealth portfolio"
            aria-invalid={!!nameError || undefined}
          />
        </FormField>

        <FormField
          label="Base Currency"
          hint={
            <p className="flex items-center gap-1 text-xs leading-5 text-muted-foreground">
              <InfoDotIcon />
              All portfolio values will be converted to this currency
            </p>
          }
        >
          <CurrencySelect value={currency} onChange={setCurrency} />
        </FormField>

        <FormField label="Description" htmlFor="portfolio-desc">
          <Input
            id="portfolio-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Long-term investments"
          />
        </FormField>

        {error && <FieldError message={getErrorMessage(error, 'Something went wrong')} />}

        <Button type="submit" size="lg" disabled={!name.trim()} loading={isPending} loadingText="Creating…" className="mt-2 w-full">
          Continue
        </Button>
      </form>
    </div>
  )
}

/** Field-styled currency picker: "USD $ | US Dollar ⌄". */
function CurrencySelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false)
  const { data: currencies = [], isLoading } = useCurrencies()
  const selected = currencies.find((c) => c.code === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={isLoading}
        className={cn(
          'flex h-10 w-full items-center overflow-hidden rounded-xl border bg-surface transition-colors',
          'focus-visible:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
          open ? 'border-primary' : 'border-border hover:border-primary/50',
        )}
      >
        <span className="w-18 shrink-0 px-3 text-left font-medium text-muted-foreground">
          {selected ? `${selected.code} ${selected.symbol}` : isLoading ? 'Loading…' : `${value}`}
        </span>
        <span className="h-5 w-px shrink-0 bg-border" />
        <span className={cn('flex-1 px-4 text-left', selected ? 'text-foreground' : 'text-subtle')}>
          {selected?.name ?? 'Select currency'}
        </span>
        <ChevronDownIcon className={cn('mx-3 size-4 transition-transform duration-200', open && 'rotate-180')} />
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width)">
        <SearchList
          items={currencies}
          getKey={(c) => c.code}
          matches={(c, q) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.symbol.includes(q)}
          selectedKey={value}
          placeholder="Search currency…"
          onSelect={(c) => {
            onChange(c.code)
            setOpen(false)
          }}
          renderItem={(c) => (
            <>
              <span className="w-12 shrink-0 font-medium text-muted-foreground">{c.code}</span>
              <span className="flex-1 truncate">{c.name}</span>
              <span className="shrink-0 text-muted-foreground">{c.symbol}</span>
            </>
          )}
        />
      </PopoverContent>
    </Popover>
  )
}

function InfoDotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-3 shrink-0">
      <circle cx="12" cy="12" r="10" className="fill-subtle" />
      <path d="M12 16v-4M12 8h.01" className="stroke-white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
