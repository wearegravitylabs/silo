import { useState } from 'react'
import { CurrencyFlag } from '@/components/currency-flag'
import { ChevronDownIcon } from '@/components/icons'
import { SearchList } from '@/components/search-list'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCurrencies, useUpdatePortfolio } from '../queries'

/** Header dropdown that changes the portfolio's base currency. */
export function CurrencySelector({ portfolioId, currentCode }: { portfolioId: string; currentCode: string }) {
  const [open, setOpen] = useState(false)
  const { data: currencies = [] } = useCurrencies()
  const { mutate: update, isPending } = useUpdatePortfolio(portfolioId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          loading={isPending}
          className="gap-1.5 px-1.5 text-sm font-medium text-foreground"
          aria-label={`Base currency: ${currentCode}`}
        >
          {!isPending && <CurrencyFlag code={currentCode} />}
          {currentCode}
          <ChevronDownIcon className="text-muted-foreground" />
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
              <CurrencyFlag code={c.code} />
              <span className="min-w-9 font-medium">{c.code}</span>
              <span className="truncate text-muted-foreground">{c.name}</span>
            </>
          )}
        />
      </PopoverContent>
    </Popover>
  )
}
