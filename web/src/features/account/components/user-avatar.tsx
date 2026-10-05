import { cn } from '@/lib/utils'
import { useMe } from '../queries'
import { getUserInitials } from '../types'

/** Current user's initials in a brand circle. Size with className (e.g. size-6 text-[9px]). */
export function UserAvatar({ className }: { className?: string }) {
  const { data: user } = useMe()
  const name = user ? `${user.first_name} ${user.last_name}` : 'Account'
  return (
    <span
      title={name}
      aria-label={name}
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-dark text-[8px] font-semibold tracking-[0.3px] text-white',
        className,
      )}
    >
      {getUserInitials(user)}
    </span>
  )
}
