import { useState } from 'react'
import { CloseIcon } from '@/components/icons'
import { PanelTabs } from '@/components/panel-layout'
import { Dialog, DialogClose, DialogTitle } from '@/components/ui/dialog'
import { SheetContent } from '@/components/ui/sheet'
import type { RuleOptions } from '../constants'
import { RULE_TABS, templatesFor, type RuleTab, type RuleTemplateId } from '../templates'
import { RuleTemplateCard } from './rule-template-card'

/**
 * "Add New Rule" panel for one scenario: a tab per rule family, each listing its templates. Filling a template's
 * blanks enables its Add, which reports the rule and closes the panel.
 */
export function AddRuleSheet({
  scenarioName,
  open,
  onOpenChange,
  onAdd,
  currency,
  options,
  defaultTab = 'growth',
}: {
  scenarioName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (template: RuleTemplateId, values: Record<string, string>) => void
  currency: string
  options: RuleOptions
  defaultTab?: RuleTab
}) {
  const [tab, setTab] = useState<RuleTab>(defaultTab)
  const { description } = RULE_TABS.find((t) => t.id === tab)!

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" aria-describedby={undefined} onCloseAutoFocus={() => setTab(defaultTab)}>
        <div className="flex h-12 shrink-0 items-center px-4 sm:px-6">
          <DialogClose
            aria-label="Close panel"
            className="-ml-1 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <CloseIcon />
          </DialogClose>
        </div>

        <div className="flex shrink-0 flex-col gap-2 px-4 pt-3 pb-5 sm:px-6">
          <span className="truncate text-eyebrow">{scenarioName}</span>
          <DialogTitle className="text-h6 leading-8">Add New Rule</DialogTitle>
        </div>

        <PanelTabs tabs={RULE_TABS} value={tab} onChange={setTab} label="Rule types" />

        {/* Keyed by tab: half-filled templates start fresh when switching */}
        <div key={tab} className="flex min-h-0 flex-1 animate-rise flex-col gap-4 overflow-y-auto px-4 pt-5 pb-6 sm:px-6">
          {description && <p className="-mb-1 text-xs leading-5">{description}</p>}
          {templatesFor(tab).map((id) => (
            <RuleTemplateCard
              key={id}
              template={id}
              currency={currency}
              options={options}
              onAdd={(values) => {
                onAdd(id, values)
                onOpenChange(false)
              }}
            />
          ))}
        </div>
      </SheetContent>
    </Dialog>
  )
}
