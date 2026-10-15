import { resolveColor } from '@/lib/colors'
import { cn } from '@/lib/utils'

/**
 * Round colour swatches as a radio group (Edit Scenario, accent colour). `colors` are any CSS colours, usually
 * tokens (`var(--color-highlight)`); the chosen one gets a ring in its own colour. Restyle a swatch with
 * `swatchClassName` (size, `aria-checked:` ring).
 */
export function ColorSwatches({
  colors,
  value,
  onChange,
  label,
  className,
  swatchClassName,
}: {
  colors: readonly string[]
  value: string | undefined
  onChange: (color: string) => void
  label: string
  className?: string
  swatchClassName?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap items-center gap-2.5', className)}>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={color === value}
          aria-label={resolveColor(color).toUpperCase()}
          onClick={() => onChange(color)}
          style={{ color }}
          className={cn(
            'size-6.5 shrink-0 rounded-full bg-current ring-offset-background transition-shadow outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2',
            'aria-checked:ring-2 aria-checked:ring-current/50 aria-checked:ring-offset-1',
            swatchClassName,
          )}
        />
      ))}
    </div>
  )
}
