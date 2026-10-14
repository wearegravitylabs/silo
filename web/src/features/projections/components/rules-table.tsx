import { useState } from 'react'
import { CirclePlusIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { DataTable, TableSearch, useTableView, type DataColumn } from '@/components/data-table'
import { DotsIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { ruleParts, ruleText } from '../constants'
import type { ProjectionRule } from '../types'

type SortKey = 'rule'
const COLUMNS: DataColumn<SortKey>[] = [{ key: 'rule', label: 'Rule' }]
const SORT_VALUE: Record<SortKey, (r: ProjectionRule) => string> = { rule: (r) => ruleText(r).toLowerCase() }

/**
 * The selected scenario's rules: search, sort, a switch per rule (the header one turns them all on or off), ⋯ to delete.
 * Export and Add Rule sit at the right of the toolbar.
 */
export function RulesTable({
  rules,
  onToggle,
  onDelete,
  onExport,
}: {
  rules: ProjectionRule[]
  onToggle: (ids: string[], enabled: boolean) => void
  onDelete: (id: string) => void
  onExport: () => void
}) {
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const view = useTableView(
    rules.filter((r) => !q || ruleText(r).toLowerCase().includes(q)),
    SORT_VALUE,
  )
  const allOn = rules.length > 0 && rules.every((r) => r.enabled)

  return (
    <DataTable
      label="Rules"
      columns={COLUMNS}
      view={view}
      toolbarClassName="py-6"
      toolbarStart={<TableSearch value={search} onChange={view.firstPage(setSearch)} label="Search rules" />}
      toolbarEnd={
        <div className="flex items-center gap-2 max-md:ml-auto">
          <Button variant="secondary" size="xs" onClick={onExport}>
            <UploadIcon className="size-3.5 text-muted-foreground" aria-hidden />
            Export
          </Button>
          {/* TODO: Add Rule isn't designed yet. */}
          <Button size="xs">
            <CirclePlusIcon className="size-3.5" aria-hidden />
            Add Rule
          </Button>
        </div>
      }
      selectHeader={
        <Switch
          checked={allOn}
          onCheckedChange={(on) =>
            onToggle(
              rules.map((r) => r.id),
              on,
            )
          }
          disabled={rules.length === 0}
          aria-label="Turn all rules on or off"
        />
      }
      skeleton={null}
      empty={
        view.rows.length > 0
          ? null
          : rules.length === 0
            ? { title: 'No Rule Yet', body: 'Once you create a rule, it will appear here' }
            : { title: 'No result found', body: 'We couldn’t find any result based on the search' }
      }
      footer={rules.length > 10}
    >
      {view.rows.map((rule) => (
        <RuleRow key={rule.id} rule={rule} onToggle={(on) => onToggle([rule.id], on)} onDelete={() => onDelete(rule.id)} />
      ))}
    </DataTable>
  )
}

/** 56px row: switch, the rule as a sentence (blue underlined values), ⋯ Delete Rule. Off rules fade. */
function RuleRow({ rule, onToggle, onDelete }: { rule: ProjectionRule; onToggle: (on: boolean) => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const text = ruleText(rule)

  return (
    <tr className={cn('h-14 transition-colors', menuOpen && 'bg-surface')}>
      <td className="pl-3 md:pl-4">
        <Switch checked={rule.enabled} onCheckedChange={onToggle} aria-label={`${text}: ${rule.enabled ? 'on' : 'off'}`} />
      </td>
      <td className={cn('py-3 text-foreground transition-opacity', !rule.enabled && 'opacity-50')}>
        {ruleParts(rule).map((part, i) =>
          part.editable ? (
            // TODO: open Edit Rule once it's designed.
            <span key={i} className="text-primary-dark underline decoration-1 underline-offset-3">
              {part.text}
            </span>
          ) : (
            <span key={i}>{part.text}</span>
          ),
        )}
      </td>
      <td className="pr-3 text-right md:pr-4">
        <DropdownMenu onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label={`${text} options`}>
              <DotsIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={onDelete}>
              <Trash2Icon className="size-4" />
              Delete Rule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
