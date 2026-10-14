import { useState } from 'react'
import { CirclePlusIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DataTable, TableSearch, useTableView, type DataColumn } from '@/components/data-table'
import { DotsIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { ruleText, type RuleOptions } from '../constants'
import type { ProjectionRule } from '../types'
import { RuleSentence } from './rule-sentence'

type SortKey = 'rule'
const COLUMNS: DataColumn<SortKey>[] = [{ key: 'rule', label: 'Rule' }]

/**
 * The selected scenario's rules: search, sort, a switch per rule (the header one turns them all on or off), blanks
 * editable in place, ⋯ to delete (after confirming). Export and Add Rule sit at the right of the toolbar.
 */
export function RulesTable({
  rules,
  currency,
  options,
  onToggle,
  onChange,
  onDelete,
  onAdd,
  onExport,
}: {
  rules: ProjectionRule[]
  currency: string
  options: RuleOptions
  onToggle: (ids: string[], enabled: boolean) => void
  onChange: (id: string, values: Record<string, string>) => void
  onDelete: (id: string) => void
  onAdd: () => void
  onExport: () => void
}) {
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const text = (r: ProjectionRule) => ruleText(r, currency, options).toLowerCase()
  const q = search.trim().toLowerCase()
  const view = useTableView(
    rules.filter((r) => !q || text(r).includes(q)),
    { rule: text },
  )
  const allOn = rules.length > 0 && rules.every((r) => r.enabled)

  return (
    <>
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
            <Button size="xs" onClick={onAdd}>
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
          <RuleRow
            key={rule.id}
            rule={rule}
            label={ruleText(rule, currency, options)}
            currency={currency}
            options={options}
            onToggle={(on) => onToggle([rule.id], on)}
            onChange={(values) => onChange(rule.id, values)}
            onDelete={() => setDeleting(rule.id)}
          />
        ))}
      </DataTable>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete Rule"
        cancelLabel="Close"
        confirmLabel="Delete Rule"
        onConfirm={() => {
          if (deleting) onDelete(deleting)
          setDeleting(null)
        }}
      >
        You’re about to delete this rule from your projection. This action cannot be undone
      </ConfirmDialog>
    </>
  )
}

/** 56px row: switch, the rule as a sentence (its blanks edit in place), ⋯ Delete Rule. Off rules fade. */
function RuleRow({
  rule,
  label,
  currency,
  options,
  onToggle,
  onChange,
  onDelete,
}: {
  rule: ProjectionRule
  label: string
  currency: string
  options: RuleOptions
  onToggle: (on: boolean) => void
  onChange: (values: Record<string, string>) => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <tr className={cn('h-14 transition-colors', menuOpen && 'bg-surface')}>
      <td className="pl-3 md:pl-4">
        <Switch checked={rule.enabled} onCheckedChange={onToggle} aria-label={`${label}: ${rule.enabled ? 'on' : 'off'}`} />
      </td>
      <td className={cn('py-3 text-foreground transition-opacity', !rule.enabled && 'opacity-50')}>
        <RuleSentence template={rule.template} values={rule.values} onChange={onChange} currency={currency} options={options} />
      </td>
      <td className="pr-3 text-right md:pr-4">
        <DropdownMenu onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label={`${label} options`}>
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
