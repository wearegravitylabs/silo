import { useState } from 'react'
import { InfoIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { EXPORT_FEATURES, EXPORT_TEMPLATES } from '../mock-data'
import type { ExportFeature, ExportTemplate } from '../types'

/** Pick what to include and a template, then Preview or Export. UI only for now. */
export function ExportTab({
  onPreview,
  onExport,
}: {
  onPreview?: () => void
  onExport?: (features: ExportFeature[], template: ExportTemplate) => void
}) {
  const [features, setFeatures] = useState<ExportFeature[]>(EXPORT_FEATURES.map((f) => f.key))
  const [template, setTemplate] = useState<ExportTemplate>('executive-summary')

  return (
    <>
      <div className="flex min-h-0 flex-col overflow-y-auto px-4 pt-4 pb-4">
        <p>Download a copy of your portfolio to share to others</p>

        <span className="mt-4 mb-1 text-eyebrow">Features</span>
        <div className="flex flex-col">
          {EXPORT_FEATURES.map((f) => (
            <label key={f.key} className="flex h-8.5 cursor-pointer items-center gap-3 text-foreground">
              <Checkbox
                checked={features.includes(f.key)}
                onCheckedChange={(on) =>
                  setFeatures((list) =>
                    on === true
                      ? EXPORT_FEATURES.map((x) => x.key).filter((k) => k === f.key || list.includes(k))
                      : list.filter((k) => k !== f.key),
                  )
                }
              />
              {f.label}
            </label>
          ))}
        </div>

        <span className="mt-4 mb-1 text-eyebrow">Template options</span>
        <RadioGroup value={template} onValueChange={(v) => setTemplate(v as ExportTemplate)} aria-label="Template">
          {EXPORT_TEMPLATES.map((t) => (
            <label key={t.key} className="flex h-8.5 cursor-pointer items-center gap-3 text-foreground">
              <RadioGroupItem value={t.key} />
              {t.label}
            </label>
          ))}
        </RadioGroup>

        <div className="mt-3 flex items-start gap-3 rounded-lg bg-accent px-4 py-3">
          <InfoIcon className="mt-0.75 size-4 shrink-0 fill-muted-foreground text-white" aria-hidden />
          <p className="leading-5.5 text-foreground">Depending on the size of export, it may take longer time to download</p>
        </div>
      </div>

      <div className="flex h-15 shrink-0 items-center justify-end gap-2 border-t border-border px-4">
        <Button variant="secondary" size="xs" onClick={onPreview} className="shadow-small">
          Preview
        </Button>
        <Button size="xs" disabled={features.length === 0} onClick={() => onExport?.(features, template)}>
          Export
        </Button>
      </div>
    </>
  )
}
