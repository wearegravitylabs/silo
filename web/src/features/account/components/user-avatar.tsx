import { cn } from '@/lib/utils'
import { useMe } from '../queries'
import { getUserInitials } from '../types'

/** Current user's photo, or their initials in a brand circle. Size with className (e.g. size-6 text-[9px]). */
export function UserAvatar({ className }: { className?: string }) {
  const { data: user } = useMe()
  const name = user ? `${user.first_name} ${user.last_name}` : 'Account'
  const base = 'flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full'

  if (user?.avatar_url) return <img src={user.avatar_url} alt={name} title={name} className={cn(base, 'object-cover', className)} />
  return (
    <span
      title={name}
      aria-label={name}
      className={cn(base, 'bg-primary-dark text-[8px] font-semibold tracking-[0.3px] text-white', className)}
    >
      {getUserInitials(user)}
    </span>
  )
}
