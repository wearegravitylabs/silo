import { cn } from '@/lib/utils'
import { ASSET_TYPES } from './asset-types'
import { StepHeading } from './step-heading'

export function TypeSelectStep({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="flex justify-center py-10">
      <div className="flex w-136 flex-col gap-8">
        <StepHeading title="Choose an Asset Type" description="Specify the type of asset you want to add." />
        <div role="radiogroup" aria-label="Asset type" className="grid grid-cols-2 gap-2">
          {ASSET_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              role="radio"
              aria-checked={selected === type.id}
              disabled={!type.enabled}
              onClick={() => onSelect(type.id)}
              className={cn(
                'flex h-13 items-center gap-3 rounded-xl border bg-background p-3 text-left transition-colors',
                'hover:border-primary-dark/40 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:cursor-not-allowed',
                'aria-checked:border-primary-dark aria-checked:bg-primary-subtle',
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle">{type.icon}</span>
              <span className="flex-1 font-medium">{type.label}</span>
              {!type.enabled && <span className="shrink-0 rounded-sm bg-accent px-1.5 py-0.5 font-medium text-subtle">soon</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
