import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { resolveColor, SCENARIO_SWATCHES } from '../constants'
import type { Scenario } from '../types'

const HEX = /^#[\da-f]{6}$/i

/** Rename a scenario and pick its colour (a swatch, or any hex). Save Changes waits for a valid change. */
export function EditScenarioDialog({
  scenario,
  open,
  onOpenChange,
  onSave,
}: {
  scenario: Scenario
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (patch: { name: string; color: string }) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-sans">Edit Scenario</DialogTitle>
        </DialogHeader>
        {/* Keyed so each opening starts from the scenario's current name and colour */}
        {open && <EditForm key={scenario.id} scenario={scenario} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  )
}

function EditForm({ scenario, onSave }: { scenario: Scenario; onSave: (patch: { name: string; color: string }) => void }) {
  const [name, setName] = useState(scenario.name)
  const [color, setColor] = useState(scenario.color)
  const [hex, setHex] = useState(() => resolveColor(scenario.color).toUpperCase())
  const nameId = useId()
  const hexId = useId()

  const valid = name.trim() !== '' && HEX.test(resolveColor(color))
  const changed = name.trim() !== scenario.name || color !== scenario.color

  const pick = (swatch: string) => {
    setColor(swatch)
    setHex(resolveColor(swatch).toUpperCase())
  }
  const typeHex = (text: string) => {
    const next = `#${text.replace(/[^\da-f]/gi, '').slice(0, 6)}`.toUpperCase()
    setHex(next)
    // A typed hex matching a swatch selects that swatch; any other complete hex becomes a custom colour.
    if (HEX.test(next)) setColor(SCENARIO_SWATCHES.find((s) => resolveColor(s).toUpperCase() === next) ?? next)
  }

  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid && changed) onSave({ name: name.trim(), color })
      }}
    >
      <DialogBody className="flex flex-col gap-6 pt-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-medium text-foreground">Colour</legend>
          <div className="flex flex-wrap items-center gap-2.5">
            <div role="radiogroup" aria-label="Colour" className="flex flex-wrap items-center gap-2.5">
              {SCENARIO_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  role="radio"
                  aria-checked={swatch === color}
                  aria-label={resolveColor(swatch).toUpperCase()}
                  onClick={() => pick(swatch)}
                  style={{ color: swatch }}
                  className={cn(
                    'size-6.5 rounded-full bg-current transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2',
                    swatch === color && 'ring-2 ring-current/50 ring-offset-1',
                  )}
                />
              ))}
            </div>
            <Input
              id={hexId}
              aria-label="Hex colour"
              value={hex}
              onChange={(e) => typeHex(e.target.value)}
              aria-invalid={!HEX.test(hex) || undefined}
              className="h-8 w-33.5 rounded-lg px-3 max-[25rem]:w-full"
            />
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor={nameId} className="font-medium">
            Name
          </label>
          <Input id={nameId} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </div>
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" size="xs">
            Close
          </Button>
        </DialogClose>
        <Button type="submit" size="xs" disabled={!valid || !changed}>
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  )
}
