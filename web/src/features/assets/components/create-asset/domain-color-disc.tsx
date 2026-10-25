import { GlobeIcon } from 'lucide-react'
import { ColorPickerDisc } from '@/components/color-picker-disc'
import { DOMAIN_COLORS } from '../../constants'

/** 64px globe disc tinted with the domain's colour; the pipette badge opens the swatches under it. */
export function DomainColorDisc({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <ColorPickerDisc colors={DOMAIN_COLORS} value={value} onChange={onChange} label="Domain colour" className="size-16">
      <span
        style={{ color: value }}
        className="flex size-full items-center justify-center rounded-full border border-current/20 bg-current/12 transition-colors"
      >
        <GlobeIcon className="size-5" aria-hidden />
      </span>
    </ColorPickerDisc>
  )
}
