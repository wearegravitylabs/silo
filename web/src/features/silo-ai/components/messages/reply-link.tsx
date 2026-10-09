import { Link, useParams } from '@tanstack/react-router'
import { ArrowUpRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReplyLink as ReplyLinkData } from '../../types'

const PATHS = {
  assets: '/portfolio/$portfolioId/assets',
  dashboard: '/portfolio/$portfolioId/dashboard',
} as const

/** A follow-up button under a reply ("View in Assets"), inside the current portfolio. */
export function ReplyLink({ link }: { link: ReplyLinkData }) {
  const { portfolioId } = useParams({ strict: false })
  const content = (
    <>
      {link.label}
      <ArrowUpRightIcon className="size-3 text-muted-foreground" aria-hidden />
    </>
  )
  const className = 'w-fit animate-rise gap-1 shadow-small'

  // Outside a portfolio (the dev gallery) there's nowhere to go: show the button without a link.
  if (!portfolioId) {
    return (
      <Button variant="secondary" size="xs" className={className}>
        {content}
      </Button>
    )
  }
  return (
    <Button variant="secondary" size="xs" asChild className={className}>
      <Link to={PATHS[link.section]} params={{ portfolioId }}>
        {content}
      </Link>
    </Button>
  )
}
