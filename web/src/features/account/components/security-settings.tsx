import { toast } from 'sonner'
import { SettingHeading } from '@/components/setting-row'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { useUpdateViewerInviteAccess, useViewerInviteAccess } from '../queries'
import type { ViewerInviteAccess } from '../types'

const INVITE_ACCESS: { value: ViewerInviteAccess; label: string }[] = [
  { value: 'sign_up', label: 'Sign up before granting portfolio access' },
  { value: 'no_sign_up', label: 'No sign-up required' },
]

/** Settings → Security: two-factor sign-in, not available yet. */
export function TwoFactorSetting() {
  return (
    <section className="flex flex-col items-start gap-3">
      <SettingHeading
        title="Two-Factor Authentication"
        badge="Soon"
        description="Increase your account's security by using multiple authentication methods to verify your identity."
      />
      <Button size="xs" disabled>
        Enable 2FA
      </Button>
    </section>
  )
}

/** Settings → Security: whether invited viewers must make an account. Saved as it's picked. */
export function ViewerInviteAccessSetting() {
  const { data: access } = useViewerInviteAccess()
  const update = useUpdateViewerInviteAccess()

  return (
    <section className="flex flex-col gap-3">
      <SettingHeading title="Viewers Invite Access" description="Choose how you would like viewers to gain access to your portfolio" />
      {access ? (
        <RadioGroup
          value={access}
          onValueChange={(next) =>
            update.mutate(next as ViewerInviteAccess, { onError: () => toast.error('Couldn’t update viewer access. Try again.') })
          }
          aria-label="Viewers invite access"
          className="gap-3"
        >
          {INVITE_ACCESS.map(({ value, label }) => (
            <label key={value} className="flex w-fit cursor-pointer items-center gap-2.5 leading-5.5">
              <RadioGroupItem value={value} className="size-4.5" />
              {label}
            </label>
          ))}
        </RadioGroup>
      ) : (
        <Skeleton className="h-14 w-72 rounded-lg" />
      )}
    </section>
  )
}
