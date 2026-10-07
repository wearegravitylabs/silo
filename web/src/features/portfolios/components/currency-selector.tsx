import { useState } from 'react'
import { ChevronDownIcon } from '@/components/icons'
import { SearchList } from '@/components/search-list'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { currencyFlag } from '@/lib/format'
import { useCurrencies, useUpdatePortfolio } from '../queries'

/** Header dropdown that changes the portfolio's base currency. */
export function CurrencySelector({ portfolioId, currentCode }: { portfolioId: string; currentCode: string }) {
  const [open, setOpen] = useState(false)
  const { data: currencies = [] } = useCurrencies()
  const { mutate: update, isPending } = useUpdatePortfolio(portfolioId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="xs" disabled={isPending} className="gap-1 px-2 font-medium" aria-label="Base currency">
          <span className="leading-none">{currencyFlag(currentCode)}</span>
          {currentCode}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-65">
        <SearchList
          items={currencies}
          getKey={(c) => c.code}
          matches={(c, q) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)}
          selectedKey={currentCode}
          placeholder="Search currency…"
          onSelect={(c) => {
            if (c.code !== currentCode) update({ base_currency: c.code })
            setOpen(false)
          }}
          renderItem={(c) => (
            <>
              <span className="leading-none">{currencyFlag(c.code)}</span>
              <span className="min-w-9 font-medium">{c.code}</span>
              <span className="truncate text-muted-foreground">{c.name}</span>
            </>
          )}
        />
      </PopoverContent>
    </Popover>
  )
}
