import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { RuleOptions } from '../constants'
import { RULE_TEMPLATES, slotsOf, type RuleTemplateId } from '../templates'
import { RuleSentence } from './rule-sentence'

/** One template in Add New Rule: section eyebrow, the sentence with its blanks, and Add (which flags empty blanks until all are filled). */
export function RuleTemplateCard({
  template,
  currency,
  options,
  onAdd,
}: {
  template: RuleTemplateId
  currency: string
  options: RuleOptions
  onAdd: (values: Record<string, string>) => void
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [missing, setMissing] = useState(false) // Add pressed too early: the empty blanks turn red
  const { section } = RULE_TEMPLATES[template] as { section?: string }
  const complete = slotsOf(template).every((s) => values[s.key])

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface" aria-label={section}>
      {section && <h3 className="px-3 pt-2 pb-1.5 font-sans text-eyebrow">{section}</h3>}
      <div
        className={cn('flex items-start justify-between gap-4 bg-background px-3 py-2.5', section && 'rounded-t-xl border-t border-border')}
      >
        <RuleSentence
          template={template}
          values={values}
          onChange={setValues}
          currency={currency}
          options={options}
          highlightEmpty={missing}
          className="leading-5.5 text-foreground"
        />
        <button
          type="button"
          onClick={() => (complete ? onAdd(values) : setMissing(true))}
          className="shrink-0 rounded-sm text-xs leading-5.5 font-semibold text-primary-dark transition-opacity outline-none hover:opacity-75 focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          Add
        </button>
      </div>
    </section>
  )
}
