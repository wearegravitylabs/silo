import { ChoiceCard } from '@/components/choice-card'
import { Tooltip } from '@/components/ui/tooltip'
import { CREATABLE_ASSET_TYPES } from '../../constants'
import { StepHeading } from './step-heading'

/** Step 1: the ten asset kinds in two columns (one on phones). Kinds without a flow yet say "Coming soon". */
export function AssetTypeStep({ selected, onSelect }: { selected: string | null; onSelect: (type: string) => void }) {
  return (
    <div className="flex w-full max-w-136 flex-col gap-9">
      <StepHeading title="Choose an Asset Type">Specify the type of asset you want to add.</StepHeading>
      <div role="radiogroup" aria-label="Asset type" className="grid gap-3 sm:grid-cols-2">
        {CREATABLE_ASSET_TYPES.map(({ id, label, Icon, enabled }) => {
          const card = (
            <ChoiceCard
              size="sm"
              label={label}
              icon={<Icon className="size-3.5 text-primary-dark" aria-hidden />}
              selected={id === selected}
              onSelect={() => onSelect(id)}
              disabled={!enabled}
              check={false}
            />
          )
          return enabled ? (
            <div key={id}>{card}</div>
          ) : (
            <Tooltip key={id} content="Coming soon" side="top">
              {/* Disabled buttons don't get hover events; the wrapper does. */}
              <div>{card}</div>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
