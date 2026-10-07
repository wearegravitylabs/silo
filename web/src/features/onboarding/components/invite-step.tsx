import { useEffect, useState } from 'react'
import { CircleCheckIcon, CopyIcon } from 'lucide-react'
import { FormHeading } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useInviteLink } from '@/features/portfolios'

const COPIED_MS = 2000

/** Owner's last step: share the portfolio's invite link with a partner. */
export function InviteStep({ portfolioId, onDone }: { portfolioId: string; onDone: () => void }) {
  const link = useInviteLink(portfolioId)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), COPIED_MS)
    return () => clearTimeout(t)
  }, [copied])

  const copy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <FormHeading
        title="Invite Partner to your Portfolio"
        subtitle="Silo allows shared portfolio management. Invite a partner to test it out."
      />

      <section className="flex flex-col gap-1 rounded-xl border border-border p-4 shadow-panel">
        <label htmlFor="invite-link" className="font-medium">
          Invite link
        </label>
        <p className="text-xs leading-5">Share this invite link with partners you would like to invite to your portfolio</p>
        <div className="mt-3 flex items-center gap-1.5">
          <Input
            id="invite-link"
            readOnly
            value={link}
            title={link}
            onFocus={(e) => e.currentTarget.select()}
            className="h-8 flex-1 rounded-lg text-ellipsis"
          />
          <Button variant="secondary" onClick={copy} aria-live="polite" className="shadow-elevated">
            {copied ? (
              <>
                <CircleCheckIcon className="size-4 fill-success text-white" aria-hidden />
                <span className="text-success">Copied!</span>
              </>
            ) : (
              <>
                <CopyIcon className="size-3.5 text-muted-foreground" aria-hidden />
                Copy
              </>
            )}
          </Button>
        </div>
      </section>

      <Button size="lg" onClick={onDone} className="w-full">
        Continue
      </Button>
    </div>
  )
}
