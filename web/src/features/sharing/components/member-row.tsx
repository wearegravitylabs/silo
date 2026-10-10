import { Avatar } from '@/components/ui/avatar'
import { ROLE_LABEL } from '../mock-data'
import type { Member } from '../types'

/** One person with access: avatar, name/email, invite badge, and their role (opens Manage Access, except the owner). */
export function MemberRow({ member, isYou, onManage }: { member: Member; isYou?: boolean; onManage?: () => void }) {
  const role = member.role === 'owner' ? 'Owner' : ROLE_LABEL[member.role]

  return (
    <li className="flex animate-rise items-center gap-3 py-2">
      <Avatar name={member.name ?? member.email} src={member.avatarUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        {member.name ? (
          <>
            <span className="truncate text-foreground">
              <span className="font-medium">{member.name}</span>
              {isYou && <span className="text-xs text-muted-foreground"> (You)</span>}
            </span>
            <span className="truncate text-xs leading-5 text-muted-foreground">{member.email}</span>
          </>
        ) : (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-xs leading-5 text-muted-foreground">{member.email}</span>
            {member.status === 'invited' && (
              <span className="shrink-0 rounded-md bg-accent px-1.5 text-xs leading-5 text-foreground">Invite Sent</span>
            )}
          </span>
        )}
      </div>
      {onManage ? (
        <button
          type="button"
          onClick={onManage}
          className="shrink-0 rounded-md text-[0.8125rem] font-semibold text-primary-dark transition-opacity outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {role}
        </button>
      ) : (
        <span className="shrink-0 text-[0.8125rem] font-semibold text-primary-dark">{role}</span>
      )}
    </li>
  )
}
