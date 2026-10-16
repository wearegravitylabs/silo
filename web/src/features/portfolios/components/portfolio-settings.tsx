import { useId, useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DangerZone, DangerZoneItem } from '@/components/danger-zone'
import { FormField } from '@/components/form-field'
import { InfoDotIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip } from '@/components/ui/tooltip'
import { UnsavedChangesBar } from '@/components/unsaved-changes-bar'
import { portfolioUrl } from '../lib'
import { useDeletePortfolio, useLeavePortfolio } from '../queries'
import type { Portfolio } from '../types'
import { AvatarPopoverPicker } from './avatar-popover-picker'
import { CurrencyField } from './currency-field'
import { usePortfolioDraft } from './use-portfolio-draft'

// Locked fields read as grey fills, not dimmed (Figma, partner view).
const LOCKED = 'disabled:bg-accent disabled:text-subtle disabled:opacity-100'

const LAST_PORTFOLIO_HINT = 'You need to be a partner of at least one portfolio'

/**
 * Body of Settings → a portfolio (inside <SettingsPage>): avatar, name, base currency, its link, Danger Zone, and the
 * unsaved-changes bar while edits are pending. Only the owner edits or deletes; anyone can leave, unless it's their
 * last portfolio. Key it on the portfolio id so the draft resets between portfolios.
 */
export function PortfolioSettings({
  portfolio,
  isOwner,
  canLeave,
  nextPortfolioId,
}: {
  portfolio: Portfolio
  isOwner: boolean
  /** False when it's the user's only portfolio: Leave and Delete are locked */
  canLeave: boolean
  /** Where to go once it's left or deleted; none → Profile */
  nextPortfolioId?: string
}) {
  const { draft, errors, change, save, discard, dirty, saving } = usePortfolioDraft(portfolio)
  const [confirming, setConfirming] = useState<'leave' | 'delete' | null>(null)
  const leave = useLeavePortfolio()
  const remove = useDeletePortfolio()
  const navigate = useNavigate()
  const id = useId()

  const goOn = () =>
    nextPortfolioId
      ? navigate({ to: '/settings/portfolios/$portfolioId', params: { portfolioId: nextPortfolioId }, replace: true })
      : navigate({ to: '/settings/profile', replace: true })

  const confirmLeave = () =>
    leave.mutate(portfolio.id, {
      onSuccess: () => {
        toast.success(`You left ${portfolio.name}`)
        goOn()
      },
      onError: () => toast.error('Couldn’t leave this portfolio. Try again.'),
    })

  const confirmDelete = () =>
    remove.mutate(portfolio.id, {
      onSuccess: () => {
        toast.success(`${portfolio.name} has been deleted`)
        goOn()
      },
      onError: () => toast.error('Couldn’t delete this portfolio. Try again.'),
    })

  return (
    <>
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <AvatarPopoverPicker value={draft.avatar} onChange={(a) => change('avatar', a)} disabled={!isOwner} />

        <FormField label="Portfolio Name" htmlFor={`${id}-name`} error={errors.name}>
          <Input
            id={`${id}-name`}
            value={draft.name}
            onChange={(e) => change('name', e.target.value)}
            disabled={!isOwner}
            aria-invalid={!!errors.name || undefined}
            className={LOCKED}
          />
        </FormField>

        <FormField
          label="Base Currency"
          htmlFor={`${id}-currency`}
          hint={
            <p className="flex items-center gap-1 text-xs leading-5 text-muted-foreground">
              <InfoDotIcon />
              This is the currency you mostly operate with
            </p>
          }
        >
          <CurrencyField
            id={`${id}-currency`}
            value={draft.currency}
            onChange={(c) => change('currency', c)}
            disabled={!isOwner}
            className={LOCKED}
          />
        </FormField>

        <FormField label="Portfolio url" htmlFor={`${id}-url`}>
          <Input id={`${id}-url`} value={portfolioUrl(draft.name)} readOnly className="cursor-default text-muted-foreground" />
        </FormField>

        {/* Lets Enter in any field save, like the bar's button */}
        <button type="submit" hidden />
      </form>

      <DangerZone className="mt-10 mb-10">
        <DangerZoneItem
          layout="inline"
          disabled={!canLeave}
          title="Leave portfolio"
          description="Remove yourself as a partner from this portfolio"
          action={
            <LockedHint locked={!canLeave}>
              <Button variant="destructive-subtle" size="xs" disabled={!canLeave} onClick={() => setConfirming('leave')}>
                Leave Portfolio
              </Button>
            </LockedHint>
          }
        />
        {isOwner && (
          <DangerZoneItem
            layout="inline"
            disabled={!canLeave}
            title="Delete portfolio"
            description="Permanently delete this portfolio and all its data"
            action={
              <LockedHint locked={!canLeave}>
                <Button variant="destructive-subtle" size="xs" disabled={!canLeave} onClick={() => setConfirming('delete')}>
                  Delete Portfolio
                </Button>
              </LockedHint>
            }
          />
        )}
      </DangerZone>

      <ConfirmDialog
        open={confirming === 'leave'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Leave Portfolio"
        confirmLabel="Leave Portfolio"
        pendingLabel="Leaving…"
        pending={leave.isPending}
        onConfirm={confirmLeave}
      >
        You’ll lose access to {portfolio.name} straight away. To come back, its owner will have to invite you again.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirming === 'delete'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Delete Portfolio"
        confirmLabel="Delete Portfolio"
        pending={remove.isPending}
        onConfirm={confirmDelete}
      >
        This permanently deletes {portfolio.name} with all its assets, debts, documents and projections, for you and every partner. It can’t
        be undone.
      </ConfirmDialog>

      <UnsavedChangesBar open={dirty} saving={saving} onSave={save} onDiscard={discard} />
    </>
  )
}

/** Explains a locked action on hover. Disabled buttons get no pointer events, so the tooltip hangs on a wrapper. */
function LockedHint({ locked, children }: { locked: boolean; children: ReactNode }) {
  if (!locked) return children
  return (
    <Tooltip content={LAST_PORTFOLIO_HINT}>
      <span tabIndex={0} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
        {children}
      </span>
    </Tooltip>
  )
}
