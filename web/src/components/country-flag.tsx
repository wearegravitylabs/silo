import { cn } from '@/lib/utils'

// Every 1:1 flag as a hashed asset URL (?no-inline: files, fetched only when shown, rather than 266 data URIs in the bundle).
const FLAG_URLS = import.meta.glob<string>('/node_modules/country-flag-icons/1x1/*.svg', {
  eager: true,
  import: 'default',
  query: '?no-inline',
})
const flagUrl = (iso2: string) => FLAG_URLS[`/node_modules/country-flag-icons/1x1/${iso2.toUpperCase()}.svg`]

/** Round flag for an ISO 3166 country code ("NG"). Size with className (default size-4). Unknown codes show their first letter. */
export function CountryFlag({ code, className }: { code: string; className?: string }) {
  const url = flagUrl(code)
  const base = cn('size-4 shrink-0 overflow-hidden rounded-full', className)

  if (!url) {
    return (
      <span aria-hidden className={cn(base, 'flex items-center justify-center bg-line text-[0.5rem] font-semibold text-muted-foreground')}>
        {code[0]}
      </span>
    )
  }
  return <img src={url} alt="" aria-hidden className={cn(base, 'object-cover')} />
}
