import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdatePortfolio } from '../queries'
import type { Portfolio } from '../types'
import { avatarIdFromImageUrl, avatarImageUrl, type AvatarId } from './avatar-picker'

export interface PortfolioDraft {
  name: string
  currency: string
  avatar: AvatarId
}

export type PortfolioErrors = Partial<Record<'name', string>>

const draftFrom = (p: Portfolio): PortfolioDraft => ({
  name: p.name,
  currency: p.base_currency,
  avatar: avatarIdFromImageUrl(p.image_url),
})

const sameDraft = (a: PortfolioDraft, b: PortfolioDraft) => a.name === b.name && a.currency === b.currency && a.avatar === b.avatar

/**
 * Editable copy of a portfolio's settings. `dirty` while it differs from what's saved; save validates then writes it,
 * discard drops it. Errors show only after a save attempt, and clear as the field is edited.
 */
export function usePortfolioDraft(portfolio: Portfolio) {
  const saved = draftFrom(portfolio)
  const [draft, setDraft] = useState(saved)
  const [errors, setErrors] = useState<PortfolioErrors>({})
  const update = useUpdatePortfolio(portfolio.id)

  const change = <K extends keyof PortfolioDraft>(key: K, value: PortfolioDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors(({ [key as keyof PortfolioErrors]: _, ...rest }) => rest)
  }

  const save = () => {
    const found: PortfolioErrors = draft.name.trim() ? {} : { name: 'Enter a portfolio name' }
    setErrors(found)
    if (found.name || update.isPending) return
    update.mutate(
      { name: draft.name.trim(), base_currency: draft.currency, image_url: avatarImageUrl(draft.avatar) },
      {
        // Re-sync with what was stored (trimmed), so the form is clean again.
        onSuccess: (p) => {
          setDraft(draftFrom(p))
          toast.success('Portfolio updated')
        },
        onError: () => toast.error('Couldn’t save your changes. Try again.'),
      },
    )
  }

  const discard = () => {
    setDraft(saved)
    setErrors({})
  }

  return { draft, errors, change, save, discard, dirty: !sameDraft(draft, saved), saving: update.isPending }
}
