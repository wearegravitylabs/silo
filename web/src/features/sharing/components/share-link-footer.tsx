import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const COPIED_MS = 2000

/** The portfolio's share link with Copy Link → "Link copied!" for two seconds. */
export function ShareLinkFooter({ link, defaultCopied = false }: { link: string; defaultCopied?: boolean }) {
  const [copied, setCopied] = useState(defaultCopied)

  useEffect(() => {
    if (!copied || defaultCopied) return // a preview stays on "Link copied!"
    const t = setTimeout(() => setCopied(false), COPIED_MS)
    return () => clearTimeout(t)
  }, [copied, defaultCopied])

  return (
    <div className="flex h-13 shrink-0 items-center gap-3 border-t border-border bg-surface px-4">
      <span className="min-w-0 flex-1 truncate text-xs tracking-wide text-muted-foreground" title={link}>
        {link}
      </span>
      <Button
        variant="secondary"
        size="xs"
        aria-live="polite"
        onClick={async () => {
          await navigator.clipboard?.writeText(link).catch(() => {})
          setCopied(true)
        }}
        className={cn('shadow-small', copied && 'text-success')}
      >
        {copied ? 'Link copied!' : 'Copy Link'}
      </Button>
    </div>
  )
}
