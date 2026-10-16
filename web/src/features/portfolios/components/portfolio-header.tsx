import { Link } from '@tanstack/react-router'
import { CopyButton } from '@/components/copy-button'
import { portfolioUrl } from '../lib'
import type { Portfolio } from '../types'
import { AvatarFace, avatarIdFromImageUrl } from './avatar-picker'

// Title and description for a portfolio's <SettingsPage>. Both show what's saved, so they change only on save.

/** Face + name */
export function PortfolioTitle({ portfolio }: { portfolio: Portfolio }) {
  return (
    <>
      <AvatarFace id={avatarIdFromImageUrl(portfolio.image_url)} className="size-6" />
      <span className="min-w-0 truncate">{portfolio.name}</span>
    </>
  )
}

/** The portfolio's link (opens its dashboard) with a copy button */
export function PortfolioLink({ portfolio }: { portfolio: Portfolio }) {
  const url = portfolioUrl(portfolio.name)
  return (
    <span className="inline-flex max-w-full items-center gap-1.5">
      <Link
        to="/portfolio/$portfolioId/dashboard"
        params={{ portfolioId: portfolio.id }}
        className="min-w-0 truncate text-primary-dark underline underline-offset-2 hover:opacity-70"
      >
        {url}
      </Link>
      <CopyButton value={url} />
    </span>
  )
}
