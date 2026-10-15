import { useState } from 'react'
import { CirclePlusIcon } from 'lucide-react'
import { DataTable, TableSearch, useTableView, type DataColumn } from '@/components/data-table'
import { FilterMenu } from '@/components/filter-menu'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ROLE_LABEL } from '../mock-data'
import type { AccessRole, Member } from '../types'
import { PartnerRow } from './partner-row'

type SortKey = 'partner' | 'access' | 'joined'

// Date joined drops out on small screens.
const COLUMNS: DataColumn<SortKey>[] = [
  { key: 'partner', label: 'Partner' },
  { key: 'access', label: 'Access Type' },
  { key: 'joined', label: 'Date joined', hideOnMobile: true },
]

const SORT_VALUE: Record<SortKey, (m: Member) => string | number | null> = {
  partner: (m) => (m.name ?? m.email).toLowerCase(),
  access: (m) => (m.role === 'owner' ? 'Owner' : ROLE_LABEL[m.role]),
  joined: (m) => m.joined_at ?? null,
}

const ROLE_FILTER = [
  { label: 'All', value: null },
  { label: ROLE_LABEL.partner, value: 'partner' },
  { label: ROLE_LABEL.viewer, value: 'viewer' },
]

/**
 * Everyone in the portfolio: the owner first, then partners/viewers and open invites. Search by name or email,
 * filter by access type (the owner shows under All only). Row menus edit or revoke; Invite Partners adds someone.
 */
export function PartnersTable({
  owner,
  members,
  loading,
  onInvite,
  onEdit,
  onRevoke,
}: {
  owner: Member
  members: Member[]
  loading?: boolean
  onInvite: () => void
  onEdit: (member: Member) => void
  onRevoke: (member: Member) => void
}) {
  const [role, setRole] = useState<AccessRole | null>(null)
  const [search, setSearch] = useState('')

  const q = search.trim().toLowerCase()
  const filtered = [owner, ...members].filter(
    (m) => (role === null || m.role === role) && (!q || m.email.toLowerCase().includes(q) || !!m.name?.toLowerCase().includes(q)),
  )
  const view = useTableView(filtered, SORT_VALUE)
  const empty = !loading && view.rows.length === 0

  return (
    <DataTable
      label="Partners"
      columns={COLUMNS}
      view={view}
      loading={loading}
      className="mx-0 mb-0 md:mx-0 md:mb-0"
      toolbarClassName="pt-0 pb-6"
      skeleton={Array.from({ length: 3 }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
      empty={empty ? { title: 'No result found', body: 'We couldn’t find anyone matching your search or filter' } : null}
      footer={!loading}
      toolbarStart={
        <>
          <TableSearch value={search} onChange={view.firstPage(setSearch)} label="Search partners" className="md:w-71" />
          <FilterMenu
            label="All"
            value={role}
            options={ROLE_FILTER}
            onChange={view.firstPage((v: string | null) => setRole(v as AccessRole | null))}
          />
        </>
      }
      toolbarEnd={
        <Button size="xs" onClick={onInvite} className="max-md:ml-auto">
          <CirclePlusIcon className="size-3.5" />
          Invite Partners
        </Button>
      }
    >
      {view.rows.map((m) => (
        <PartnerRow
          key={m.id}
          member={m}
          selected={view.isSelected(m.id)}
          onSelect={(on) => view.toggle(m.id, on)}
          onEdit={() => onEdit(m)}
          onRevoke={() => onRevoke(m)}
        />
      ))}
    </DataTable>
  )
}

function SkeletonRow() {
  return (
    <tr className="h-18" aria-hidden>
      <td className="pl-3 md:pl-4">
        <Skeleton className="size-4" />
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2.5 w-36" />
          </div>
        </div>
      </td>
      <td>
        <Skeleton className="h-3 w-14" />
      </td>
      <td className="hidden md:table-cell">
        <Skeleton className="h-3 w-20" />
      </td>
      <td />
    </tr>
  )
}
