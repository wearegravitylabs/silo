import { ChevronDownIcon, LockIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { ALL_SECTIONS, SECTIONS } from '../mock-data'
import type { SectionKey } from '../types'

/** "All pages and files", or the picked sections joined ("Dashboard, Assets, Debts"). */
export function accessSummary(sections: SectionKey[]) {
  if (sections.length === ALL_SECTIONS.length) return 'All pages and files'
  if (sections.length === 0) return 'No pages selected'
  return SECTIONS.filter((s) => sections.includes(s.key))
    .map((s) => s.label)
    .join(', ')
}

/** 🔒 summary ⌄ — opens a checklist of sections with a tri-state Select All. */
export function AccessSelect({
  value,
  onChange,
  defaultOpen,
}: {
  value: SectionKey[]
  onChange: (sections: SectionKey[]) => void
  defaultOpen?: boolean
}) {
  const all = value.length === ALL_SECTIONS.length
  const some = value.length > 0 && !all

  const toggle = (key: SectionKey, on: boolean) =>
    onChange(on ? ALL_SECTIONS.filter((k) => k === key || value.includes(k)) : value.filter((k) => k !== key))

  return (
    <Popover defaultOpen={defaultOpen}>
      <PopoverTrigger className="group flex h-8 w-full items-center gap-2 rounded-md text-left text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
        <LockIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{accessSummary(value)}</span>
        <ChevronDownIcon
          className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={4} className="w-(--radix-popover-trigger-width) rounded-xl p-1">
        <Row label="Select All" checked={all ? true : some ? 'indeterminate' : false} onChange={(on) => onChange(on ? ALL_SECTIONS : [])} />
        {SECTIONS.map((s) => (
          <Row key={s.key} label={s.label} checked={value.includes(s.key)} onChange={(on) => toggle(s.key, on)} />
        ))}
      </PopoverContent>
    </Popover>
  )
}

function Row({ label, checked, onChange }: { label: string; checked: boolean | 'indeterminate'; onChange: (on: boolean) => void }) {
  return (
    <label className={cn('flex h-8.5 cursor-pointer items-center gap-3 rounded-lg px-2 text-foreground transition-colors hover:bg-accent')}>
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(c === true)} />
      {label}
    </label>
  )
}
