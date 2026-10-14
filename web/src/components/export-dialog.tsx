import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export interface ExportFormat {
  value: string
  label: string
}

const DEFAULT_FORMATS: ExportFormat[] = [
  { value: 'xlsx', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
]

/** "Export …" modal: choose a file format, then Export (reports the format and closes) or Close. */
export function ExportDialog({
  title,
  open,
  onOpenChange,
  formats = DEFAULT_FORMATS,
  defaultFormat = formats[0]?.value,
  onExport,
}: {
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  formats?: ExportFormat[]
  defaultFormat?: string
  onExport?: (format: string) => void
}) {
  const [format, setFormat] = useState(defaultFormat)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-sans">{title}</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col pb-5">
          <p id="export-type" className="font-medium text-foreground">
            Export Type
          </p>
          <p className="mt-1 text-xs leading-5">Choose the file format</p>
          <RadioGroup value={format} onValueChange={setFormat} aria-labelledby="export-type" className="mt-3 grid grid-cols-2 gap-3">
            {formats.map((f) => (
              <label key={f.value} className="flex cursor-pointer items-center gap-2 text-foreground">
                <RadioGroupItem value={f.value} />
                {f.label}
              </label>
            ))}
          </RadioGroup>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="xs">
              Close
            </Button>
          </DialogClose>
          <Button
            size="xs"
            disabled={!format}
            onClick={() => {
              onExport?.(format!)
              onOpenChange(false)
            }}
          >
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
