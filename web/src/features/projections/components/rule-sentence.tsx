import { useState } from 'react'
import { cn } from '@/lib/utils'
import { slotText, type RuleOptions } from '../constants'
import { RULE_TEMPLATES, type Part, type RuleTemplateId, type Slot } from '../templates'
import { SlotDialog } from './slot-dialog'

/**
 * A rule template as a sentence: plain text with blue underlined blanks. Clicking a blank opens its modal (a field
 * or a list); saving reports the new values. Used by the rules table and Add New Rule.
 */
export function RuleSentence({
  template,
  values,
  onChange,
  currency,
  options,
  highlightEmpty,
  className,
}: {
  template: RuleTemplateId
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  currency: string
  options: RuleOptions
  /** Show unfilled blanks in red */
  highlightEmpty?: boolean
  className?: string
}) {
  const [editing, setEditing] = useState<Slot | null>(null)

  return (
    <span className={className}>
      {(RULE_TEMPLATES[template].parts as Part[]).map((part, i) => {
        if (typeof part === 'string') return <span key={i}>{part}</span>
        const value = values[part.key]
        return (
          <span key={part.key}>
            <button
              type="button"
              onClick={() => setEditing(part)}
              className={cn(
                'rounded-sm underline decoration-1 underline-offset-3 transition-[opacity,color] outline-none hover:opacity-75 focus-visible:ring-2 focus-visible:ring-ring/40',
                highlightEmpty && !value ? 'text-destructive' : 'text-primary-dark',
              )}
            >
              {value ? slotText(part, value, currency, options) : part.placeholder}
            </button>
            {/* An empty blank keeps its suffix outside the link ("X% per year"); once filled it joins it */}
            {!value && part.suffix}
          </span>
        )
      })}
      {editing && (
        <SlotDialog
          key={editing.key}
          slot={editing}
          value={values[editing.key] ?? ''}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          onSave={(value) => onChange({ ...values, [editing.key]: value })}
          currency={currency}
          options={options}
        />
      )}
    </span>
  )
}
