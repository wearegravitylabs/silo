import { FieldError } from '@/components/field-error'
import { FormHeading } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { AvatarFace, avatarIdFromImageUrl, useInvite, useRequestToJoin } from '@/features/portfolios'
import { getErrorMessage } from '@/lib/api-client'

/** Invited user's first step: see the portfolio behind the link and ask to join it. */
export function JoinPortfolioStep({ token, onRequested }: { token: string; onRequested: () => void }) {
  const invite = useInvite(token)
  const { mutate, isPending, error } = useRequestToJoin()
  const { owner } = invite

  return (
    <div className="flex flex-col gap-6">
      <FormHeading
        title="Join this Portfolio"
        subtitle="You've been invited to join this portfolio, click continue to join the portfolio"
      />

      <section className="flex items-center gap-3 rounded-xl border border-border p-3">
        <AvatarFace id={avatarIdFromImageUrl(invite.portfolio.image_url)} className="size-10" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="truncate font-medium text-foreground">{invite.portfolio.name}</p>
          <p className="flex items-center gap-1.5 text-xs leading-5">
            <MemberAvatar firstName={owner.first_name} lastName={owner.last_name} avatarUrl={owner.avatar_url} />
            {owner.first_name} is in the portfolio
          </p>
        </div>
      </section>

      {error && <FieldError message={getErrorMessage(error, 'Something went wrong')} />}

      <Button
        size="lg"
        loading={isPending}
        loadingText="Sending request…"
        onClick={() => mutate(token, { onSuccess: onRequested })}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  )
}

/** Tiny portfolio-member face: their photo, or initials when they have none. */
function MemberAvatar({ firstName, lastName, avatarUrl }: { firstName: string; lastName: string; avatarUrl: string | null }) {
  if (avatarUrl) return <img src={avatarUrl} alt="" className="size-4 shrink-0 rounded-full object-cover" />
  return (
    <span
      aria-hidden
      className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary-dark text-[7px] font-semibold text-white"
    >
      {`${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()}
    </span>
  )
}
