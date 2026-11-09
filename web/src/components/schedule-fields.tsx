import { useState } from 'react'
import { DateField } from '@/components/date-field'
import { FormField } from '@/components/form-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FREQUENCY_LABELS, type Frequency } from '@/lib/schedule'

export const END_BEFORE_START = 'End date must be after the start date'

export interface ScheduleValue {
  frequency: Frequency
  start_date: string
  end_date: string | null
}

/**
 * How often, from when and until when (optional) — the schedule half of an Auto-Pilot rule form, seeded from `rule`
 * when editing. `complete` once there's a start and the end isn't before it; `value` is what to save.
 */
export function useScheduleFields(rule: ScheduleValue | null) {
  const [frequency, setFrequency] = useState<Frequency>(rule?.frequency ?? 'weekly')
  const [start, setStart] = useState(rule?.start_date ?? '')
  const [end, setEnd] = useState(rule?.end_date ?? '')
  const endError = end && start && end < start ? END_BEFORE_START : undefined
  const value: ScheduleValue = { frequency, start_date: start, end_date: end || null }
  return { frequency, start, end, setFrequency, setStart, setEnd, endError, complete: start !== '' && !endError, value }
}

/** Frequency (from `frequencies`), Start Date* and End Date, driven by `useScheduleFields`. */
export function ScheduleFields({ fields, frequencies }: { fields: ReturnType<typeof useScheduleFields>; frequencies: Frequency[] }) {
  const { frequency, start, end, setFrequency, setStart, setEnd, endError } = fields
  return (
    <>
      <FormField label="Frequency" htmlFor="rule-frequency" required>
        <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
          <SelectTrigger id="rule-frequency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {frequencies.map((f) => (
              <SelectItem key={f} value={f}>
                {FREQUENCY_LABELS[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Start Date" htmlFor="rule-start" required>
        <DateField id="rule-start" value={start} onChange={setStart} />
      </FormField>
      <FormField label="End Date" htmlFor="rule-end" error={endError}>
        <DateField id="rule-end" value={end} onChange={setEnd} min={start || undefined} invalid={!!endError} />
      </FormField>
    </>
  )
}
