import { useState } from 'react'
import { SelectCell } from '@/components/data-table'
import { Avatar } from '@/components/ui/avatar'
import { formatDayMonthYear } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ROLE_LABEL } from '../mock-data'
import type { Member } from '../types'
import { PartnerRowMenu } from './partner-row-menu'

/**
 * One 72px person row: avatar (photo, or initial — lime once they've joined, grey while invited), name over
 * email (just the email until they sign up), access type, date joined, ⋯ (not for the owner).
 */
export function PartnerRow({
  member,
  selected,
  onSelect,
  onEdit,
  onRevoke,
}: {
  member: Member
  selected: boolean
  onSelect: (selected: boolean) => void
  onEdit?: () => void
  onRevoke?: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const invited = member.status === 'invited'
  const label = member.name ?? member.email

  return (
    <tr className={cn('h-18 transition-colors', (menuOpen || selected) && 'bg-surface')}>
      <SelectCell checked={selected} onChange={onSelect} label={`Select ${label}`} />
      <td>
        <div className="flex min-w-0 items-center gap-2">
          <Avatar
            name={label}
            src={member.avatarUrl}
            className={cn(
              'size-10 border-0 text-xl leading-none font-medium text-ink',
              invited ? 'bg-accent text-foreground' : 'bg-highlight',
            )}
          />
          <div className="flex min-w-0 flex-col gap-1">
            {member.name && <span className="truncate leading-5.5 text-foreground">{member.name}</span>}
            <span className="truncate text-xs leading-4 text-muted-foreground">{member.email}</span>
          </div>
        </div>
      </td>
      <td className="truncate text-foreground">{member.role === 'owner' ? 'Owner' : ROLE_LABEL[member.role]}</td>
      <td className="hidden text-foreground md:table-cell">{member.joined_at ? formatDayMonthYear(member.joined_at) : '--'}</td>
      <td className="pr-3 text-right md:pr-4">
        {member.role !== 'owner' && onEdit && onRevoke && (
          <PartnerRowMenu label={label} invited={invited} onOpenChange={setMenuOpen} onEdit={onEdit} onRevoke={onRevoke} />
        )}
      </td>
    </tr>
  )
}
