import { useRef, useState } from 'react'
import { FormField } from '@/components/form-field'
import { ChevronDownIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { currencyFlag, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { uploadFile } from '../../api'
import { isValidLot, LotFields } from './lot-fields'
import { SubmitError, SummaryList, TwoPane } from './step-layout'
import type { ManualStockForm } from './types'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'NGN', 'GHS', 'KES', 'ZAR']

export function ManualStockStep({
  form,
  onChange,
  creating,
  onSubmit,
  error,
}: {
  form: ManualStockForm
  onChange: (f: ManualStockForm) => void
  creating: boolean
  onSubmit: () => void
  error?: string | null
}) {
  const set = <K extends keyof ManualStockForm>(key: K, value: ManualStockForm[K]) => onChange({ ...form, [key]: value })

  const price = parseFloat(form.price)
  const hasPrice = !isNaN(price) && price > 0
  const quantity = form.lots.reduce((s, l) => s + (parseFloat(l.quantity) || 0), 0)
  const valid = form.name.trim() !== '' && hasPrice && form.lots.length > 0 && form.lots.every(isValidLot)
  const money = (v: number) => formatCurrency(v, form.currency || 'USD')

  return (
    <TwoPane
      form={
        <div className="flex flex-col gap-4">
          <div className="mb-1 flex flex-col items-center gap-3 text-center">
            <LogoUpload imageUrl={form.imageUrl} onUploaded={(url) => set('imageUrl', url)} />
            <h2 className="font-heading text-2xl leading-8 font-bold">Add {form.name.trim() || '___'} stock</h2>
            <p className="leading-5.5 text-muted-foreground">Manually track your stock position</p>
          </div>

          <FormField label="Stock Name" htmlFor="manual-name" required>
            <Input
              id="manual-name"
              autoFocus
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Apple Inc."
            />
          </FormField>

          <FormField label="Ticker" htmlFor="manual-ticker">
            <Input
              id="manual-ticker"
              value={form.ticker}
              onChange={(e) => set('ticker', e.target.value.toUpperCase())}
              placeholder="e.g. AAPL (optional)"
            />
          </FormField>

          <FormField label="Current Price" htmlFor="manual-price" required>
            <div className="flex h-10 overflow-hidden rounded-xl border bg-surface focus-within:border-primary">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex h-full min-w-23 shrink-0 items-center gap-1 px-3 outline-none"
                  aria-label="Price currency"
                >
                  <span className="leading-none">{currencyFlag(form.currency)}</span>
                  {form.currency}
                  <ChevronDownIcon className="size-2.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-28 p-1">
                  {CURRENCIES.map((c) => (
                    <DropdownMenuItem
                      key={c}
                      onSelect={() => set('currency', c)}
                      className={cn('rounded-md py-1 font-normal', c === form.currency && 'bg-accent')}
                    >
                      <span className="text-xs">{currencyFlag(c)}</span>
                      {c}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <input
                id="manual-price"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent px-4 outline-none placeholder:text-subtle"
              />
            </div>
          </FormField>

          <hr className="my-1 border-border" />

          <LotFields lots={form.lots} onChange={(lots) => set('lots', lots)} />
        </div>
      }
      summary={
        <>
          <SummaryList
            title="Asset Summary"
            rows={[
              { label: 'Company', value: form.name || '—' },
              { label: 'Ticker', value: form.ticker || '—' },
              { label: 'Current Price', value: hasPrice ? `${money(price)} ${form.currency}` : '—' },
              { label: 'Exchange', value: 'Manual' },
              {
                label: 'Total Value',
                value: hasPrice && quantity > 0 ? money(price * quantity) : '—',
                valueClassName: 'font-semibold tracking-normal',
              },
            ]}
          />
          <Button onClick={onSubmit} disabled={!valid || creating} className="w-full">
            {creating ? 'Adding…' : `Add ${form.name.trim() || 'Asset'}`}
          </Button>
          {error && <SubmitError message={error} />}
        </>
      }
    />
  )
}

/** 64px round image picker; uploads immediately and reports the hosted URL. */
function LogoUpload({ imageUrl, onUploaded }: { imageUrl: string | null; onUploaded: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [failed, setFailed] = useState(false)

  const upload = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setFailed(false)
    try {
      onUploaded((await uploadFile(file)).url)
    } catch {
      setFailed(true)
    } finally {
      setUploading(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
      <button
        type="button"
        disabled={uploading}
        onClick={() => input.current?.click()}
        aria-label={imageUrl ? 'Change image' : 'Upload image'}
        className="relative size-16 shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        <span className="flex size-full items-center justify-center overflow-hidden rounded-full border bg-accent">
          {uploading ? (
            <span className="size-5 animate-spin rounded-full border-2 border-subtle border-t-primary-dark" />
          ) : imageUrl ? (
            <img src={imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-6 text-muted-foreground">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M3 16l4.5-4.5 3 3 4-5 4.5 6.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
            </svg>
          )}
        </span>
        <span className="absolute right-0 bottom-0 flex size-5.5 items-center justify-center rounded-full bg-background shadow-panel">
          <svg
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className={cn('size-3', imageUrl ? 'text-primary-dark' : 'text-muted-foreground')}
          >
            {imageUrl ? (
              <path
                d="M1 9l2.5-2.5L9 1l2 2-5.5 5.5L3 11l-2-2z"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path d="M6 8V3M4 5l2-2 2 2M2 10h8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </span>
      </button>
      {failed && <span className="text-xs text-destructive">Upload failed. Please try again.</span>}
    </>
  )
}
